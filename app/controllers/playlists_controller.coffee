action 'all', ->
    # Here we use the method all to retrieve all tracks stored.
    Track.all (err, tracks) ->
        if err
            send error: true, msg: "Server error occured while retrieving data.", 500
        else
            send tracks, 200

action 'show', ->
    @playlist.tracks (err, tracks)->
        out = @playlist.toObject()
        out.tracks = tracks
        send out, 200