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
, only: ['destroy', 'getAttachment', 'update']

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

            # don't ask about this lines
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
        console.log "close"
        stream.abort()

# Update track attributes
action 'update', ->
    @track.updateAttributes req.body, (err) ->
        if err
            compound.logger.write err
            send error: 'Cannot update track', 500
        else
            send success: 'track successfully updated', 200