AppView = require 'views/app_view'

module.exports = class Router extends Backbone.Router

    routes:
        '': 'main'
        'playqueue': 'playqueue'
        'playlist/:playlistId': 'playlist'

    main: ->
        unless @mainView?
            @mainView = new AppView()
            @mainView.render()
        @mainView.showTrackList()


    playlist: (id)->
        alert "not implemented yet"

    playqueue: ->
        unless @mainView?
            @mainView = new AppView()
            @mainView.render()
        @mainView.showPlayQueue()
