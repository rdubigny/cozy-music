BaseView = require '../lib/base_view'
InlinePlayer = require 'views/inlineplayer'
Player = require 'views/player/player'

module.exports = class AppView extends BaseView

    el: 'body.application'
    template: require('./templates/home')

    player: null

    afterRender: ->
        # soundManager is ready to be called here (cf. application.coffee)
        @player = new Player()
        @player.render()
        @$('#player').append @player.$el