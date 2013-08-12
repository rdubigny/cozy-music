module.exports =

    initialize: ->
        # Used in inter-app communication
        #SocketListener = require '../lib/socket_listener

        # Routing management
        Router = require 'router'
        @router = new Router()

        TrackCollection = require 'collections/track_collection'
        @tracks = new TrackCollection()
        @tracks.fetch
            error: =>
                msg = "Files couldn't be retrieved due to a server error."
                alert msg

        @soundManager = soundManager

        @soundManager.setup
            # disable or enable debug output
            debugMode: true
            debugFlash: false
            useFlashBlock: false
            # always prefer flash even for MP3/MP4 when HTML5 audio is available
            preferFlash: true
            # setup the display update rate while reading songs (in ms)
            flashPollingInterval: 500
            html5PollingInterval: 500
            # path to directory containing SM2 SWF
            url: "swf/"
            # optional: enable MPEG-4/AAC support (requires flash 9)
            flashVersion: 9
            onready: ->
                $('.button.play').toggleClass('stopped loading')
            ontimeout: ->
                $('.button.play').toggleClass('unplayable loading')

        Backbone.history.start()

        # Makes this object immuable.
        Object.freeze this if typeof Object.freeze is 'function'