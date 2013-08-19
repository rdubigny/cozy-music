BaseView = require '../lib/base_view'
Uploader = require './uploader'
Tracks = require './tracks'
PlayQueue = require './playqueue'
Player = require './player/player'
OffScreenNav = require './off_screen_nav'
app = require 'application'

module.exports = class AppView extends BaseView

    el: 'body.application'
    template: require('./templates/home')

    afterRender: ->
        # header used as uploader
        @uploader = new Uploader
        @$('#uploader').append @uploader.$el
        @uploader.render()

        @player = new Player()
        @$('#player').append @player.$el
        @player.render()

        PlaylistCollection = require 'collections/playlist_collection'
        @playlists = new PlaylistCollection()
        @playlists.fetch
            success: (collection)=>
                @offScreenNav = new OffScreenNav
                    collection: collection
                @$('#off-screen-nav').append @offScreenNav.$el
                @offScreenNav.render()
            error: =>
                msg = "Files couldn't be retrieved due to a server error."
                alert msg

    showTrackList: =>
        if @queueList?
            @queueList.removeScrollBar()
            @queueList.$el.detach()
        unless @tracklist?
            @tracklist = new Tracks
                collection: app.tracks
        @$('#tracks-display').append @tracklist.$el
        @tracklist.render()

    showPlayQueue: =>
        if @tracklist?
            @tracklist.removeScrollBar()
            @tracklist.$el.detach()
        unless @queueList?
            @queueList = new PlayQueue
                collection: app.playQueue
        @$('#tracks-display').append @queueList.$el
        @queueList.render()
