PlaylistTrackCollection = require '../collections/playlist'

module.exports = class Playlist extends Backbone.Model

    # This field is required to know from where data should be loaded.
    rootUrl: "playlists"

    initialize: ->
        super
        @tracks = new PlaylistTrackCollection [],
            url: "playlists/#{@id}"