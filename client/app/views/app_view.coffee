BaseView = require '../lib/base_view'
TrackList = require './tracklist'
Player = require './player/player'
app = require 'application'

module.exports = class AppView extends BaseView

    el: 'body.application'
    template: require('./templates/home')

    player: null

    afterRender: ->
        # list of all tracks available
        @trackList = new TrackList
            collection: app.tracks
        @$('#tracks-display').append @trackList.$el
        @trackList.render()

        # soundManager is ready to be called here (cf. application.coffee)
        @player = new Player()
        @$('#player').append @player.$el
        @player.render()

