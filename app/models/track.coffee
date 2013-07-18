module.exports = (compound, Track) ->
    Track.all = (params, callback) ->
        # Here we use the Data System API, We retrieve our data through a request
        # defined at application initialization.
        Track.request "all", params, callback