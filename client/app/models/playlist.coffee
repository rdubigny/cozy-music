PlaylistTrackCollection = require '../collections/playlist'

module.exports = class Playlist extends Backbone.Model

    # This field is required to know from where data should be loaded.
    urlRoot: "playlists"

    initialize: ->
        super
        @listenTo @, 'change:id', (e)=>
            @tracks.playlistId = "#{@id}"
            @tracks.url = "playlists/#{@id}"

        @tracks = new PlaylistTrackCollection false,
            url: "playlists/#{@id}"
        @tracks.playlistId = "#{@id}"

    #destroy: ->
    #    @tracks.beforeDestroy()
    #    #super