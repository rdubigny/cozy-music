module.exports = (compound) ->

    Track = compound.models.Track

    all = (doc) ->
        # That means retrieve all docs and order them by title.
        emit doc.title, doc

    Track.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Track.All requests, cannot be created"
            compound.logger.write err

    byPlaylist = (track) ->
        for playlist in track.playlists
            emit playlist, track # playlist = id

    Track.defineRequest "byPlaylist", byPlaylist, (err)-> # envoie la définition à couchDB pour créer l'index
        if err
            compound.logger.write "Track.byPlaylist requests, cannot be created"
            compound.logger.write err

    Playlist = compound.models.Playlist

    Playlist.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Playlist.All requests, cannot be created"
            compound.logger.write err