TrackCollection = require '../collections/track_collection'

module.exports = class Playlist extends Backbone.Model

    # This field is required to know from where data should be loaded.
    rootUrl: 'playlists'

    constructor: ->
        @tracks = new TrackCollection()
        return super
