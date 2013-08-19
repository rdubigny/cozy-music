module.exports = (compound, Playlist) ->
    Playlist.all = (params, callback) ->
        # Here we use the Data System API, We retrieve our data through a request
        # defined at application initialization.
        Playlist.request "all", params, callback

    # bind playlist prototype
    Playlist::tracks = (callback) ->
        Track = compound.models.Track
        params =
            key: @id
        Track.request "byPlaylist", params, callback # request map reduce