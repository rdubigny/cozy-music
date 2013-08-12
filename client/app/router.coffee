AppView = require 'views/app_view'

module.exports = class Router extends Backbone.Router

    routes:
        '': 'main'
        'playlist/:albumid'     : 'playlist'

    main: ->
        mainView = new AppView()
        mainView.render()

    ###
    playlist: (id)->
        mainView = new AppView()
        console.log id #params.fileName('playlist') #mainView.idList = -1
        mainView.render()
    ###