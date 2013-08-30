AppView = require 'views/app_view'

module.exports = class Router extends Backbone.Router

    routes:
        '': 'main'
        'playqueue': 'playqueue'
        'playlist/:playlistId': 'playlist'

    initialize: ->
        @mainView = new AppView()
        @mainView.render()

        # bind keyboard events
        @lastSeen = null
        @atHome = false
        Mousetrap.bind 'v', @onVKey

    onVKey: =>
        # toggle between the home and last seen list view
        if @atHome
            if @lastSeen?
                @navigate "playlist/#{@lastSeen}", true
            else
                @navigate "playqueue", true
        else
            @navigate "", true

    main: ->
        @atHome = true
        @mainView.showTrackList()

    # display the playlist view for an playlist with given id
    # fetch before displaying it
    playlist: (id)->
        alert "not available yet"
        return @navigate "", true
        @atHome = false
        @lastSeen = id
        @mainView.showPlayList id

    playqueue: ->
        @atHome = false
        @lastSeen = null
        @mainView.showPlayQueue()
