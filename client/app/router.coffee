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
        @navigate '', true
        alert "not available yet. Playlist are comming soon!"
        ###
        playlist = @mainView.playlists.get id
        playlist.fetch()
        .done =>
            @mainView.showPlayList playlist
            ##
            @displayView new AlbumView
                model: playlist
                editable: editable
                contacts: []
            ##
        .fail =>
            alert t 'this playlist does not exist'
            @navigate '', true
        ##
        # display the album view for an album with given id
        # fetch before displaying it
        playlist = @mainView.playlists.get(id) #or new Album id:id
        #playlist.fetchTracks()
        #.done =>
        #    console.log "that's ok"
            #@displayView new AlbumView
            #    model: album
            #    editable: editable
            #    contacts: []

        #.fail =>
        #    alert 'this album does not exist'
        #    @navigate '', true

        Backbone.sync 'read', playlist.tracks,
            success: ->
                console.log "sync... done"
                console.log playlist
            error: ->
                console.log "sync... fail"
        ###

    playqueue: ->
        @mainView.showPlayQueue()
