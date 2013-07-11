###
Here is the player with some freaking awesome features like play and pause...
###
BaseView = require '../../lib/base_view'
VolumeManager = require './volumeManager'
app = require '../../application'

module.exports = class Player extends BaseView

    className: "player"
    tagName: "div"
    template: require('../templates/player/player')

    events:
        "click .button.play": "onClickPlay"

    afterRender: =>
        #@playButton = new VolumeManager()
        #$('.player').append @volumeManager.render().$el
        @volumeManager = new VolumeManager()
        @volumeManager.render()
        #@$('.player').append @volumeManager.$el
        #console.debug @$el
        @$el.append @volumeManager.$el

        @currentTrack = app.soundManager.createSound
            id: "DaSound"
            url: "music/COMA - Hoooooray.mp3"
            duration: 5000
            onfinish: @stopTrack
            onstop: @stopTrack
            #whileplaying: ->
            #    soundManager._writeDebug "whileplaying(): #{@position}/#{@duration}"
        @isStopped = true
        @isPaused = false
        @isPlayable = soundManager.canPlayLink("music/COMA - Hoooooray.mp3")
        @playButton = @$(".button.play")
        @playButton.addClass("stopped")

    onClickPlay: (event)->
        event.preventDefault()
        if @isStopped
            #setTimeout(@currentTrack.stop, 5000);
            @currentTrack.play()
            @playButton.removeClass("stopped")
            @isStopped = false
        else if @isPaused
            @currentTrack.play()
            @playButton.removeClass("paused")
            @isPaused = false
        else if not @isPaused and not @isStopped
            @currentTrack.pause()
            @playButton.addClass("paused")
            @isPaused = true

    stopTrack: =>
        @playButton.addClass("stopped")
        @isStopped = true
        @playButton.removeClass("paused")
        @isPaused = false