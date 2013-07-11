module.exports =

    initialize: ->
        # Used in inter-app communication
        #SocketListener = require '../lib/socket_listener

        # Routing management
        Router = require 'router'
        @router = new Router()

        @soundManager = soundManager

        @soundManager.setup
            # disable or enable debug output
            debugMode: true
            # use HTML5 audio for MP3/MP4, if available
            preferFlash: false
            useFlashBlock: true
            # path to directory containing SM2 SWF
            url: "../swf/"
            # optional: enable MPEG-4/AAC support (requires flash 9)
            flashVersion: 9

        @soundManager.onready ->
            Backbone.history.start()

        # Makes this object immuable.
        Object.freeze this if typeof Object.freeze is 'function'