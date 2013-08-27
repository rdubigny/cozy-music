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

    # display the playlist view for an playlist with given id
    # fetch before displaying it
    playlist: (id)->
        @mainView.showPlayList id

    playqueue: ->
        @mainView.showPlayQueue()
