BaseView = require '../lib/base_view'
Uploader = require './uploader'
Tracks = require './tracks'
PlayQueue = require './playqueue'
Player = require './player/player'
OffScreenNav = require './off_screen_nav'
app = require 'application'

module.exports = class AppView extends BaseView

    el: 'body.application'
    template: require('./templates/home')
    events:
        # handle all keyboard events
        'keypress': (e)->
            Backbone.Mediator.publish 'keyboard:keypress', e

    afterRender: ->
        # header used as uploader
        @uploader = new Uploader
        @$('#uploader').append @uploader.$el
        @uploader.render()

        @player = new Player()
        @$('#player').append @player.$el
        @player.render()

        @offScreenNav = new OffScreenNav()
        @$('#off-screen-nav').append @offScreenNav.$el
        @offScreenNav.render()

    showTrackList: =>
        if @queueList?
            @queueList.$el.detach()
        unless @tracklist?
            @tracklist = new Tracks
                    collection: app.tracks
        @$('#tracks-display').append @tracklist.$el
        @tracklist.render()

    showPlayQueue: =>
        if @tracklist?
            @tracklist.$el.detach()
        unless @queueList?
            @queueList = new PlayQueue
                    collection: app.playQueue
        @$('#tracks-display').append @queueList.$el
        @queueList.render()
