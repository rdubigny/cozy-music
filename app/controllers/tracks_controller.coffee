request = require 'request-json'

# pre-function that ensures that track really exists and loads it
before ->
    # Find track
    Track.find req.params.id, (err, track) =>
        if err or not track
            send error: true, msg: "Track not found", 404
        else
            @track = track
            next()
# Make this pre-treatment only before destroy action.
, only: ['destroy', 'getAttachment', 'update', 'remove', 'add']

action 'all', ->
    # Here we use the method all to retrieve all tracks stored.
    Track.all (err, tracks) ->
        if err
            send error: true, msg: "Server error occured while retrieving data.", 500
        else
            send tracks, 200

action 'create', ->
    file = req.files["file"]
    req.body.slug = file.name

    Track.create req.body, (err, newtrack) =>
        if err
            send error: true, msg: "Server error while creating track.", 500
        else
            newtrack.attachFile file.path, {"name": file.name}, (err) ->
                if err
                    send error: true, msg: "Server error while add attachment file.", 500
                else
                    send newtrack, 200

action 'destroy', ->
    @track.destroy (err) ->
        if err
            compound.logger.write err
            send error: 'Cannot destroy track', 500
        else
            send success: 'track successfully deleted', 200


action 'getAttachment', ->
    fileName = params.fileName
    # update attributes
    updatedAttribute =
        lastPlay: Date.now()
        plays: @track.plays+1
    @track.updateAttributes updatedAttribute, (err) ->
        if err
            compound.logger.write err

    # get file
    stream = @track.getFile fileName, (err, resp, body) ->
        if err or not resp?
            send 500
        else if resp.statusCode is 404
            send 'File not found', 404
        else if resp.statusCode != 200
            send 500
        else
            send 200

    if req.headers['range']?
        stream.setHeader('range', req.headers['range'])

    stream.pipe(res) # this is compound "magic" res = response variable

    # if the client close the, transmit the
    res.on 'close', ->
        stream.abort()

# Update track attributes
action 'update', ->
    @track.updateAttributes req.body, (err) ->
        if err
            compound.logger.write err
            send error: 'Cannot update track', 500
        else
            send success: 'track successfully updated', 200

# add to playlist
action 'add', ->
    # update attributes
    pl = @track.playlists
    newPlaylists =  if pl? and pl isnt "" then pl else []
    unless req.params.playlistid in newPlaylists
        newPlaylists.push req.params.playlistid
        updatedAttribute =
            playlists: newPlaylists
        @track.updateAttributes updatedAttribute, (err) ->
            if err
                compound.logger.write err
                send error: 'Cannot add track', 500
            else
                send success: 'Track successfully added', 200
    else
        send error: 'Track is already in the playlist', 403

# remove from playlist
action 'remove', ->
    # update attributes
    pl = @track.playlists
    if pl? and pl isnt ""
        ind = pl.indexOf req.params.playlistid
        if ind isnt -1
            pl.splice ind, 1
            updatedAttribute =
                playlists: pl

            ###
            updateAttributes: (model, id, data, callback) ->
                @client.put "data/merge/#{id}/", data, (error, response, body) =>
                    if error
                        callback error
                    else if response.statusCode is 404
                        callback new Error("Document not found")
                    else if response.statusCode isnt 200
                        callback new Error("Server error occured.")
                    else
                        callback()
            ###

            @track.updateAttributes updatedAttribute, (err, resp) ->
                if err
                    # if track has just been deleted from database
                    # no need to remove it from playlist
                    if resp.statusCode is 404
                        send 'Track not found', 200
                    else
                        compound.logger.write err
                        send error: 'Cannot remove track', 500
                else
                    send success: 'Track successfully removed', 200
    else
        send error: 'Track is not in the playlist', 403

action 'youtube', ->
    # get video id from youtube-mp3.org
    @url = "http://youtube.com/watch?v=#{params.url}"
    http = require('http')
    p = "/a/pushItem/?item=#{encodeURI(@url)}&el=na&bf=false&r=#{Date.now()}"
    options =
        host: 'www.youtube-mp3.org'
        port: 80
        path: p
        headers:
            'Accept-Location': '*'
    http.get options, (resp)->
        resp.on 'data', onVideoId
    .on 'error', (e) ->
        compound.logger.write e.message
        send error: "Got error: #{e.message}", 500

    # then fetch information from youtube-mp3.org
    onVideoId = (video_id)->
        return send error: true, "invalid video id" unless video_id?
        p = "/a/itemInfo/?video_id=#{video_id}&ac=www&t=grp&r=#{Date.now()}"
        options =
            host: 'www.youtube-mp3.org'
            port: 80
            path: p
            headers:
                'Accept-Location': '*'
        http.get options, (resp)->
            resp.on 'data', (info)->
                onInfo(info, video_id)
        .on 'error', (e) ->
            compound.logger.write e.message
            send error: true, "Got error: #{e.message}", 500

    # then generate download link and download the mp3 file
    onInfo = (info_json, video_id)->
        if info_json.toString() is "pushItemYTError();"
            msg = "There was an error caused by YouTube, this video can't be delivered! Check copyright issues or video URL. Video longer than 20 minutes aren't supported"
            return send error: true, msg
        # check for errors
        msg = "There was an error caused by youtube-mp3.org"
        return send error: true, msg unless info_json?
        info_parsed = info_json.toString().match(/{.*}/)
        return send error: true, msg unless info_parsed?[0]?
        info = JSON.parse info_parsed[0]
        msg = "Youtube-mp3.org didn't delivered any mp3 downloadable link"
        return send error: true, msg, 500 if info.status isnt "serving"
        # here it becomes dirty
        # I didn't want to use a dependency just for this
        client = request.newClient 'http://www.youtube-mp3.org/'
        title = "#{info.title}.mp3"
        path = "get?video_id=#{video_id}&h=#{info.h}&r=#{Date.now()}"
        destFile = "/tmp/#{title}"
        client.saveFile path, destFile, (err, res, body) ->
            return send error: true, err if err
            req.body.slug = title
            req.body.title = title
            req.body.artist = ""
            req.body.album = ""
            req.body.track = ""
            req.body.year = ""
            req.body.genre = ""
            req.body.time = ""
            Track.create req.body, (err, newTrack) =>
                if err
                    send error: true, "can't create track.", 500
                else
                    newTrack.attachFile destFile, {"name": title}, (err) ->
                        if err
                            send error: true, "can't attach file.", 500
                        else
                            send newTrack, 200