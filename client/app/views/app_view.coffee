BaseView = require '../lib/base_view'
Uploader = require './uploader'
Tracks = require './tracks'
PlayQueue = require './playqueue'
Playlist = require './playlist'
Player = require './player/player'
OffScreenNav = require './off_screen_nav'
app = require 'application'
PlaylistCollection = require 'collections/playlist_collection'

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

    initialize: ->
        super
        Cookies.defaults =
            expires: 604800 # = 1 week
        @playList = {}
        @currentPlaylistId = 0

    afterRender: ->
        super
        # header used as uploader
        @uploader = new Uploader
        @$('#uploader').append @uploader.$el
        @uploader.render()

        @player = new Player()
        @$('#player').append @player.$el
        @player.render()
        @playlistCollection = new PlaylistCollection()
        @playlistCollection.fetch
            success: (collection)=>
                @offScreenNav = new OffScreenNav
                    collection: collection
                @$('#off-screen-nav').append @offScreenNav.$el
                @offScreenNav.render()
            error: =>
                msg = "Playlists couldn't be retrieved due to a server error."
                alert msg

        # prevent to leave the page if playing or uploading
        window.onbeforeunload = =>
            msg = ""
            app.tracks.each (track)=>
                state = track.attributes.state
                if msg is "" and state isnt 'server'
                    msg += "upload will be cancelled "

            if not @player.isStopped and not @player.isPaused
                msg += "music will be stopped"

            if msg isnt "" and app.playQueue.length > 0
                msg += " & your queue list will be erased."

            if msg isnt ""
                return msg
            else
                return

    showTrackList: =>
        # append the main track list
        if @queueList?
            @queueList.beforeDetach()
            @queueList.$el.detach()
        if @playList[@currentPlaylistId]?
            @playList[@currentPlaylistId].beforeDetach()
            @playList[@currentPlaylistId].$el.detach()
        unless @tracklist?
            @tracklist = new Tracks
                collection: app.tracks
        @$('#tracks-display').append @tracklist.$el
        @tracklist.render()
        # update header and nav display
        unless $('#header-nav-title-home').hasClass 'activated'
            $('#header-nav-title-home').addClass 'activated'
        $('#header-nav-title-list').removeClass 'activated'
        @offScreenNav?.$('li.activated').removeClass 'activated'

    showPlayQueue: =>
        # append the play queue
        if @tracklist?
            @tracklist.beforeDetach()
            @tracklist.$el.detach()
        if @playList[@currentPlaylistId]?
            @playList[@currentPlaylistId].beforeDetach()
            @playList[@currentPlaylistId].$el.detach()
        unless @queueList?
            @queueList = new PlayQueue
                collection: app.playQueue
        @$('#tracks-display').append @queueList.$el
        @queueList.render()
        # update header and nav display
        unless $('#header-nav-title-list').hasClass 'activated'
            $('#header-nav-title-list').addClass 'activated'
        $('#header-nav-title-home').removeClass 'activated'
        @offScreenNav?.$('li.activated').removeClass 'activated'

    showPlayList: (id)=>
        # append the playlist
        if @tracklist?
            @tracklist.beforeDetach()
            @tracklist.$el.detach()
        if @queueList?
            @queueList.beforeDetach()
            @queueList.$el.detach()
        if @playList[@currentPlaylistId]?
            @playList[@currentPlaylistId].beforeDetach()
            @playList[@currentPlaylistId].$el.detach()
        @currentPlaylistId = id
        @offScreenNav?.$('li.activated').removeClass 'activated'
        playlistModel = @playlistCollection.get id
        if playlistModel?
            @appendPlaylist playlistModel
        else
            @listenToOnce @playlistCollection, 'sync', (collection)->
                playlistModel = collection.get id
                if playlistModel?
                    @appendPlaylist playlistModel
                else
                    alert 'unable to get this playlist'
                    if app.router.lastSeen is id
                        app.router.lastSeen = null
                    app.router.navigate '', true

        # update header and nav display
        $('#header-nav-title-list').removeClass 'activated'
        $('#header-nav-title-home').removeClass 'activated'

    appendPlaylist: (playlistModel)->
        unless @playList[@currentPlaylistId]?
            @playList[@currentPlaylistId] = new Playlist
                collection: playlistModel.tracks
        @$('#tracks-display').append @playList[@currentPlaylistId].$el
        @playList[@currentPlaylistId].render()
        cid = playlistModel.cid
        @offScreenNav.views[cid].$('li').addClass 'activated'
