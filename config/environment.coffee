module.exports = (compound) ->
    express = require 'express'
    app = compound.app

    app.configure ->
        app.enable 'coffee'
        app.use express.static(app.root + '/client/public', maxAge: 86400000)
        app.use express.bodyParser(keepExtensions: true)
        app.use express.methodOverride()
        app.use app.router

        # use an other client for public routes
        app.use '/public', express.static(app.root + '/public_client/public', maxAge: 86400000)
