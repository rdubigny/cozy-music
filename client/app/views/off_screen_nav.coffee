###
  Off screen nav view
###
app = require '../application'
BaseView = require '../../lib/base_view'
Playlist = require '../models/playlist'
PlaylistNavView = require './playlist_nav_view'
ViewCollection = require '../lib/view_collection'

module.exports = class OffScreenNav extends ViewCollection

    className: 'off-screen-nav'
    tagName: 'div'
    template: require('./templates/off_screen_nav')

    itemview: PlaylistNavView
    collectionEl: '#playlist-list'

    magicCounterSensibility : 2
    magicCounter : @magicCounterSensibility

    events:
        'click .add-playlist-button': 'onAddPlaylist'
        'playlist-selected': 'onPlaylistSelected'
        'playlist-unselected': 'unSelect'
        'click' : (e) ->
            @toggleNav()
        'mousemove': (e) ->
            unless @onScreen
                @magicToggle e
        'mouseleave': (e) ->
            if @onScreen
                @toggleNav()


    initialize: (options)->
        super
        @listenTo @collection, 'remove', (playlist)->
            # if this playlist is the selected playlist, update the app variable
            if app.selectedPlaylist is playlist
                @unSelect()

    afterRender: =>
        super
        # adding scrollbar
        @$('#playlist-list').niceScroll
            cursorcolor: "#fff"
            cursorborder: ""
            cursorwidth: "2px"
            hidecursordelay: "700"
            horizrailenabled: false
            spacebarenabled: false
            enablekeyboard: false

        @onScreen = @$('.off-screen-nav-content').hasClass 'off-screen-nav-show'

    magicToggle: (e)=>
        if e.pageX is 0
            @magicCounter -= 1
        else
            @magicCounter = @magicCounterSensibility
        if @magicCounter is 0
            @magicCounter = @magicCounterSensibility
            @toggleNav()

    toggleNav: =>
        @onScreen = !@onScreen
        @$('.off-screen-nav-content').toggleClass 'off-screen-nav-show'
        @updateDisplay()

    updateDisplay: ->
        if @$('.off-screen-nav-content').hasClass 'off-screen-nav-show'
            @$('.off-screen-nav-toggle-arrow').addClass 'on'
        else
            @$('.off-screen-nav-toggle-arrow').removeClass 'on'

    onAddPlaylist: (event)->
        event.preventDefault()
        event.stopPropagation()
        # prompt to retrieve the title of the new playlist
        title = ""
        defaultMsg = "Please enter the new playlist title :"
        defaultVal = "my playlist"
        until title isnt "" and title.length < 50
            title = prompt defaultMsg, defaultVal
            # return if creation was canceled by user
            return unless title?
            defaultMsg = "Invalid title, please try again :"
            defaultVal = title

        # Data to be used to create the new model
        playlist = new Playlist
            title: title

        # Save it through collection, this will automatically add it to the
        # current list when request finishes.
        @collection.create playlist,
            success: (model)=>
                # auto-select the new playlist
                @views[model.cid].$('.select-playlist-button').trigger 'click'
                app.router.navigate '', true
            error: -> alert "Server error occured, playlist wasn't created"

    onPlaylistSelected: (event, playlist)->
        if app.selectedPlaylist?
            @views[app.selectedPlaylist.cid].$('li').removeClass('selected')
        app.selectedPlaylist = playlist
        Backbone.Mediator.publish 'offScreenNav:newPlaylistSelected', playlist

    unSelect: ->
        app.selectedPlaylist = null
        Backbone.Mediator.publish 'offScreenNav:newPlaylistSelected', null