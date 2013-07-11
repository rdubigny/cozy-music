BaseView = require '../lib/base_view'
InlinePlayer = require 'views/inlineplayer'
Player = require 'views/player/player'

module.exports = class AppView extends BaseView

    el: 'body.application'
    template: require('./templates/home')

    #inlinePlayer: null
    player: null

    afterRender: ->
        # soundManager.createSound() etc. may now be called
        #@inlinePlayer = new InlinePlayer()
        @player = new Player()
        @player.render()
        @$('.player').append @player.$el
        #console.log "write more code here !"