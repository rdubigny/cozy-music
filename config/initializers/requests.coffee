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
            emit playlist.id, track # playlist is an id

    # send the definition to couchDB to create the index
    Track.defineRequest "byPlaylist", byPlaylist, (err)->
        if err
            compound.logger.write "Track.byPlaylist requests, cannot be created"
            compound.logger.write err

    Playlist = compound.models.Playlist

    Playlist.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Playlist.All requests, cannot be created"
            compound.logger.write err