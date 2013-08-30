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

    # you shouldn't ask about this lines
    file = req.files["file"]
    req.body.slug = file.name

    Track.create req.body, (err, newtrack) =>
        if err
            send error: true, msg: "Server error while creating track.", 500
        else

            # don't ask about this lines too
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
    unless req.params.playlistId in newPlaylists
        newPlaylists.push req.params.playlistId
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
        ind = pl.indexOf @playlistId
        if ind isnt -1
            pl.splice ind, 1
            updatedAttribute =
                playlists: pl
            @track.updateAttributes updatedAttribute, (err) ->
                if err
                    compound.logger.write err
                    send error: 'Cannot remove track', 500
                else
                    send success: 'Track successfully removed', 200
    else
        send error: 'Track is not in the playlist', 403

action 'youtube', ->
    @url = "http://youtube.com/watch?v=#{params.url}"
    http = require('http')
    options =
        host: 'www.youtube-mp3.org'
        port: 80
        path: "/a/pushItem/?item=#{encodeURI(@url)}&el=na&bf=false&r=#{Date.now()}"
        headers:
            'Accept-Location': '*'
    http.get options, (resp)->
        resp.on 'data', (video_id)->
            return send error: true, "invalid video id" unless video_id?
            options =
                host: 'www.youtube-mp3.org'
                port: 80
                path: "/a/itemInfo/?video_id=#{video_id}&ac=www&t=grp&r=#{Date.now()}"
                headers:
                    'Accept-Location': '*'
            http.get options, (resp)->
                resp.on 'data', (info_json)->
                    return send error: true, "unable to get video info" unless info_json?
                    info_parsed = info_json.toString().match(/{.*}/)
                    return send error: true, "unable to get video info" unless info_parsed?[0]?
                    info = JSON.parse info_parsed[0]
                    if info.status is "serving"
                        title = info.title
                        # here it becomes dirty
                        client = request.newClient 'http://www.youtube-mp3.org/'
                        path = "get?video_id=#{video_id}&h=#{info.h}&r=#{Date.now()}"
                        destFile = "/tmp/#{title}.mp3"
                        client.saveFile path, destFile, (err, res, body) ->
                            return send error: true, err if err
                            req.body.slug = "#{title}.mp3"
                            req.body.title = "#{title}.mp3"
                            req.body.artist = ""
                            req.body.album = ""
                            req.body.track = ""
                            req.body.year = ""
                            req.body.genre = ""
                            req.body.time = ""
                            Track.create req.body, (err, newTrack) =>
                                if err
                                    send error: true, msg: "Server error while creating track.", 500
                                else
                                    newTrack.attachFile destFile, {"name": "#{title}.mp3"}, (err) ->
                                        if err
                                            send error: true, msg: "Server error while add attachment file.", 500
                                        else
                                            send newTrack, 200
                    else
                        send error: "status is not serving", 500
            .on 'error', (e) ->
                compound.logger.write e.message
                send error: "Got error: #{e.message}", 500
    .on 'error', (e) ->
        compound.logger.write e.message
        send error: "Got error: #{e.message}", 500