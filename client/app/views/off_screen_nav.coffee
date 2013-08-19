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

    initialize: (options)->
        super
        # bind keyboard events
        Mousetrap.bind 'v', @onVKey

    afterRender: =>
        super
        @$el.on 'click', @onToggleOn
        @$el.on 'mousemove', @magicToggle
        @notOnHome = $(location).attr('href').match(/playqueue$/)?
        #@toggleNav()

        # adding scrollbar
        @$('#playlist-list').niceScroll
            cursorcolor: "#fff"
            cursorborder: ""
            cursorwidth: "2px"
            hidecursordelay: "700"
            horizrailenabled: false
            spacebarenabled: false
            enablekeyboard: false

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
            @onToggleOn()

    onToggleOn: =>
        @$el.off 'click', @onToggleOn
        @$el.on 'click', @onToggleOff
        @$el.off 'mousemove', @magicToggle
        @$el.on 'mouseleave', @onToggleOff
        @toggleNav()

    onToggleOff: =>
        @$el.off 'click', @onToggleOff
        @$el.on 'click', @onToggleOn
        @$el.off 'mouseleave', @onToggleOff
        @$el.on 'mousemove', @magicToggle
        @toggleNav()

    toggleNav: =>
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
            playlist =
                title: title

            # Save it through collection, this will automatically add it to the
            # current list when request finishes.
            @collection.create playlist,
                success: (model)->
                    playlist =
                        id : model.attributes.id # don't work yet
                error: -> alert "Server error occured, playlist wasn't created"