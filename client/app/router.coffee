AppView = require 'views/app_view'

module.exports = class Router extends Backbone.Router

    routes:
        '': 'main'
        'playlist/:playlistId': 'playlist'

    main: ->
        unless @mainView?
            @mainView = new AppView()
            @mainView.render()
        @mainView.showTrackList()


    playlist: (id)->
        unless @mainView?
            @mainView = new AppView()
            @mainView.render()
        if id is "playqueue"
            @mainView.showPlayQueue()
