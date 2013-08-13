module.exports = (compound, Playlist) ->
    Playlist.all = (params, callback) ->
        # Here we use the Data System API, We retrieve our data through a request
        # defined at application initialization.
        Playlist.request "all", params, callback

    Playlist::tracks = (callback) -> # attache le prototype d'une playlist
        Track = compound.models.Track
        params =
            key: @id
        Track.request "byPlaylist", params, callback # request map reduce