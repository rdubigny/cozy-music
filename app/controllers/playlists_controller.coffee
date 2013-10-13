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
        tracks.sort (track1, track2)->
            for elem in track1.playlists
                if elem.id is req.params.id
                    weight1 = elem.weight
            for elem in track2.playlists
                if elem.id is req.params.id
                    weight2 = elem.weight
            return 0 unless weight1? and weight2? and weight1 isnt weight2
            if weight1 > weight2
                return 1 # sort 1 to a higher index than 2 (2 comes first)
            else
                return -1 # sort 1 to a lower index than 2
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