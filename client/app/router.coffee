AppView = require 'views/app_view'

module.exports = class Router extends Backbone.Router

    routes:
        '': 'main'
        'playqueue': 'playqueue'
        'playlist/:playlistId': 'playlist'

    initialize: ->
        @mainView = new AppView()
        @mainView.render()

    main: ->
        @mainView.showTrackList()


    playlist: (id)->
        alert "not implemented yet. Can't open playlist #{id}"

    playqueue: ->
        @mainView.showPlayQueue()
