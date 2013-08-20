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
                app.selectedPlaylist = null

        # bind keyboard events
        Mousetrap.bind 'v', @onVKey

    afterRender: =>
        super
        @notOnHome = $(location).attr('href').match(/playqueue$/)?

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

    onVKey: =>
        # toggle between the 2 views
        if @notOnHome
            app.router.navigate '#', true
        else
            app.router.navigate '#playqueue', true
        @notOnHome = !@notOnHome

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
            defaultMsg = "Invalid title, please try again :"
            defaultVal = title

        # if creation wasn't canceled by user
        if title?
            # Data to be used to create the new model
            playlist = new Playlist
                title: title

            # Save it through collection, this will automatically add it to the
            # current list when request finishes.
            @collection.create playlist,
                error: -> alert "Server error occured, playlist wasn't created"

            # auto-select the new playlist
            @views[playlist.cid].$('.select-playlist-button').trigger 'click'

    onPlaylistSelected: (event, playlist)->
        if app.selectedPlaylist?
            @views[app.selectedPlaylist.cid].$('li').removeClass('selected')
        app.selectedPlaylist = playlist