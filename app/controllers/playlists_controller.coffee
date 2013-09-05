before ->
    # Find playlist
    Playlist.find req.params.id, (err, playlist) =>
        if err or not playlist
            send error: true, msg: "Playlist not found", 404
        else
            @playlist = playlist
            next()
# Make this pre-treatment only before destroy action.
, only: ['destroy', 'show']

action 'all', ->
    # Here we use the method all to retrieve all playlists stored.
    Playlist.all (err, playlists) ->
        if err
            compound.logger.write err
            send error: true, msg: "Server error occured while retrieving data.", 500
        else
            send playlists, 200

action 'show', ->
    @playlist.tracks (err, tracks)=>
        out = tracks
        send out, 200

action 'create', ->
    Playlist.create req.body, (err, playlist) =>
        if err
            compound.logger.write err
            send error: true, msg: "Server error while creating playlist.", 500
        else
            send playlist, 200

action 'destroy', ->
    @playlist.destroy (err) ->
        if err
            compound.logger.write err
            send error: "Cannot destroy playlist", 500
        else
            send success: "playlist successfully deleted", 200