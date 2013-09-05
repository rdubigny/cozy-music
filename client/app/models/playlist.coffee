PlaylistTrackCollection = require '../collections/playlist'
app = require 'application'

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

        if @id?
            @tracks.fetch()
        else
            @listenToOnce @, 'sync', (e)=>
                @tracks.fetch()

    destroy: ->
        # if this list is beeing displayed navigate to home
        curUrl = "#{document.URL}"
        str = "#playlist/#{@id}"
        regex = new RegExp str
        if curUrl.match regex
            app.router.navigate '', true
        # empty playlist
        # this emptying method avoid us to encounter issues with indexes
        until @tracks.length is 0
            track = @tracks.first()
            @tracks.remove track
        # then destroy it
        super
        # return false, for the super to be call
        false