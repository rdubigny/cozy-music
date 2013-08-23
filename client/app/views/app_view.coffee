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

    events:
        'drop': (e) ->
            @uploader.onFilesDropped e
            if @queueList?
                @queueList.enableSort()
        'dragover' : (e) ->
            if @queueList?
                @queueList.disableSort()
            @uploader.onDragOver e
        'dragenter': (e) ->
            if @queueList?
                @queueList.disableSort()
            @uploader.onDragOver e
        'dragend': (e) ->
            @uploader.onDragOut e
            if @queueList?
                @queueList.enableSort()
        'dragleave': (e) ->
            @uploader.onDragOut e
            if @queueList?
                @queueList.enableSort()

    afterRender: ->
        # header used as uploader
        @uploader = new Uploader
        @$('#uploader').append @uploader.$el
        @uploader.render()

        @player = new Player()
        @$('#player').append @player.$el
        @player.render()

        # prevent to leave the page if playing
        window.onbeforeunload = =>
            if not @player.isStopped and not @player.isPaused
                return "The music will be stop and your queue-list erased."

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
        # append the main track list
        if @queueList?
            @queueList.beforeDetach()
            @queueList.$el.detach()
        unless @tracklist?
            @tracklist = new Tracks
                collection: app.tracks
        @$('#tracks-display').append @tracklist.$el
        @tracklist.render()
        # update header display
        unless $('#header-nav-title-home').hasClass('activated')
            $('#header-nav-title-home').addClass('activated')
        $('#header-nav-title-list').removeClass('activated')

    showPlayQueue: =>
        # append the play queue
        if @tracklist?
            @tracklist.beforeDetach()
            @tracklist.$el.detach()
        unless @queueList?
            @queueList = new PlayQueue
                collection: app.playQueue
        @$('#tracks-display').append @queueList.$el
        @queueList.render()
        # update header display
        unless $('#header-nav-title-list').hasClass('activated')
            $('#header-nav-title-list').addClass('activated')
        $('#header-nav-title-home').removeClass('activated')
