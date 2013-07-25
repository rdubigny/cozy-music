module.exports =

    initialize: ->
        # Used in inter-app communication
        #SocketListener = require '../lib/socket_listener

        # Routing management
        Router = require 'router'
        @router = new Router()

        TrackCollection = require 'collections/track'
        @tracks = new TrackCollection()

        @soundManager = soundManager

        @soundManager.setup
            # disable or enable debug output
            debugMode: false
            debugFlash: false
            # use HTML5 audio for MP3/MP4, if available
            preferFlash: false
            useFlashBlock: true
            # setup the display update rate while reading songs (in ms)
            flashPollingInterval: 500
            html5PollingInterval: 500
            # path to directory containing SM2 SWF
            url: "../swf/"
            # optional: enable MPEG-4/AAC support (requires flash 9)
            flashVersion: 9

        @soundManager.onready ->
            Backbone.history.start()

        # Makes this object immuable.
        Object.freeze this if typeof Object.freeze is 'function'