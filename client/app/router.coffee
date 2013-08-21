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
        # display the album view for an album with given id
        # fetch before displaying it
        ###
        playlist = @mainView.playlists.get(id) #or new Album id:id
        playlist.fetch()
        .done =>
            console.log "that's ok"
            #@displayView new AlbumView
            #    model: album
            #    editable: editable
            #    contacts: []

        .fail =>
            alert 'this album does not exist'
            @navigate '', true

        console.log playlist
        ###
        alert "not available yet. Playlist are comming soon!"
        @navigate '', true

    playqueue: ->
        @mainView.showPlayQueue()
