BaseView = require '../lib/base_view'
Uploader = require './uploader'
TrackList = require './tracklist'
Player = require './player/player'
OffScreenNav = require './off_screen_nav'
app = require 'application'

module.exports = class AppView extends BaseView

    el: 'body.application'
    template: require('./templates/home')
    events:
        'keypress': (e)->
            Backbone.Mediator.publish 'keyboard:keypress', e

    afterRender: ->
        # header used as uploader
        @uploader = new Uploader
        @$('#uploader').append @uploader.$el
        @uploader.render()

        # list of all tracks available
        @trackList = new TrackList
            collection: app.tracks
        @$('#tracks-display').append @trackList.$el
        @trackList.render()

        @player = new Player()
        @$('#player').append @player.$el
        @player.render()

        @offScreenNav = new OffScreenNav()
        @$('#off-screen-nav').append @offScreenNav.$el
        @offScreenNav.render()