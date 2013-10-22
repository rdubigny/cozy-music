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
, only: ['destroy', 'getAttachment', 'update', 'remove', 'add', 'move']

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
        plays: @track.plays + 1
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
estimatedMaxSize = 300 #improve weight allotment
action 'add', ->
    pl = @track.playlists
    newPlaylists =  if pl? and pl isnt "" then pl else []
    alreadyIn = false
    for elem in newPlaylists
        if elem? and req.params.playlistid is elem.id
            alreadyIn = true
    unless alreadyIn
        oldW = parseInt(req.params.lastWeight)
        newW = oldW + Math.floor(Math.pow(2,53) / estimatedMaxSize)
        if newW < oldW
            # overflow!
            newW = Math.floor((Math.pow(2,53) - oldW)/2) + oldW
        newPlaylists.push
            id: req.params.playlistid
            weight: newW
        updatedAttribute =
            playlists: newPlaylists
        @track.updateAttributes updatedAttribute, (err) ->
            if err
                compound.logger.write err
                send error: 'Cannot add track', 500
            else
                send newPlaylists, 200
    else
        send error: 'Track is already in the playlist', 403

# remove from playlist
action 'remove', ->
    # update attributes
    pl = @track.playlists
    if pl? and pl isnt ""
        for elem in pl
            if elem.id is req.params.playlistid
                ind = pl.indexOf elem

        send(error: 'Track is not in the playlist', 403) unless ind?
        pl.splice ind, 1
        updatedAttribute =
            playlists: pl

        @track.updateAttributes updatedAttribute, (err, resp) ->
            # I'm pure evil :
            # if there is any error nobody will ever heard of it!
            # Mouahahahah!
            # mostly, error here are due to already deleted tracks
            send success: 'Track successfully removed', 200
    else
        send error: 'Track is not in the playlist', 403

# move track in playlist
action 'move', ->
    pl = @track.playlists
    unless pl? and pl isnt ""
        send error: 'Track is not in the playlist', 403
    for elem in pl
        if elem.id is req.params.playlistid
            ind = pl.indexOf elem
    unless ind?
        send error: 'Track is not in the playlist', 403
    nxt = parseInt req.params.nextWeight
    prv = parseInt req.params.prevWeight
    pl[ind].weight = Math.floor((nxt - prv)/2) + prv

    updatedAttribute =
        playlists: pl
    @track.updateAttributes updatedAttribute, (err) ->
        if err
            compound.logger.write err
            send error: 'Cannot move track', 500
        else
            send pl, 200

action 'youtube', ->

    @url = "http://youtube.com/watch?v=#{params.url}"

    # get video id from youtube-mp3.org
    client = request.newClient 'http://www.youtube-mp3.org/'
    path = "/a/pushItem/?item=#{encodeURI(@url)}&el=na&bf=false&r=#{Date.now()}"
    client.get path, (err, res, videoId)->
        return send error: true, msg: "invalid video id" unless videoId?

        # then fetch information from youtube-mp3.org
        path = "/a/itemInfo/?video_id=#{videoId}&ac=www&t=grp&r=#{Date.now()}"
        client.get path, (err, res, infos)->
            if err
                compound.logger.write err
                send error: true, msg: "Got error: #{e.message}", 500
            onInfos infos, videoId
        , false

    , false

    # then generate download link and download the mp3 file
    onInfos = (infoJson, videoId)->

        if infoJson.toString() is "pushItemYTError();"
            msg = "There was an error caused by YouTube, this video can't be delivered! Check copyright issues or video URL. Video longer than 20 minutes aren't supported"
            return send error: true, msg: msg

        # check for errors
        msg = "There was an error caused by youtube-mp3.org"
        return send error: true, msg: msg unless infoJson?

        infoParsed = infoJson.toString().match(/{.*}/)
        return send error: true, msg: msg unless infoParsed?[0]?

        info = JSON.parse infoParsed[0]
        msg = "Youtube-mp3.org didn't delivered any mp3 downloadable link"
        return send error: true, msg: msg, 500 if info.status isnt "serving"

        # here it becomes dirty
        # I didn't want to use a dependency just for this
        title = "#{info.title}.mp3"
        path = "get?video_id=#{videoId}&h=#{info.h}&r=#{Date.now()}"
        destFile = "/tmp/#{title}"
        stream = client.saveFileAsStream path, (err, res, body) ->
            if err
                console.log "Error occured while saving file"
                console.log err

        # TODO parse title to extract artist name and track name.
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
                console.log err
                console.log err.message
                console.log err.error
                send error: true, msg: "can't create track.", 500
            else
                newTrack.attachFile stream, {"name": title}, (err) ->
                    if err
                        util = require 'util'
                        console.log err.error
                        console.log util.inspect err
                        send error: true, msg: "can't attach file.", 500
                    else
                        send newTrack, 200
