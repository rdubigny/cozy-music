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
        "mousedown .progress": "onMouseDownProgress"

    afterRender: =>
        initialVolume = 50 # default volume value

        # create, bind and display the volume bar
        @vent = _.extend {}, Backbone.Events
        @vent.bind "volumeHasChanged", @onVolumeChange
        @vent.bind "muteHasBeenToggled", @onToggleMute
        @volumeManager = new VolumeManager({initVol: initialVolume,vent: @vent})
        @volumeManager.render()
        @$('#volume').append @volumeManager.$el

        # bind the progress bar
        @elapsedTime = @$('#elapsedTime')
        @remainingTime = @$('#remainingTime')
        @progress = @$('.progress')
        @progressInner = @$('.progress .inner')

        #loading the track
        @currentTrack = app.soundManager.createSound
            id: "DaSound#{(Math.random()*1000).toFixed(0)}"
            url: "music/COMA - Hoooooray.mp3"
            volume: initialVolume
            onfinish: @stopTrack
            onstop: @stopTrack
            whileplaying: @updateProgressDisplay

        # initializing variables
        @progressInner.width "0%"
        @elapsedTime.html "0:00"
        @remainingTime.html @formatMs @currentTrack.durationEstimate
        @isStopped = true
        @isPaused = false

        # bind play button
        @playButton = @$(".button.play")

    onClickPlay: ->
        if @isStopped
            @currentTrack.play()
            @playButton.removeClass("stopped")
            @isStopped = false
        else if @isPaused
            @currentTrack.play()
            @playButton.removeClass("paused")
            @isPaused = false
        else if not @isPaused and not @isStopped # <=> isPlaying
            @currentTrack.pause()
            @playButton.addClass("paused")
            @isPaused = true

    stopTrack: =>
        @playButton.addClass("stopped")
        @isStopped = true
        @playButton.removeClass("paused")
        @isPaused = false
        @updateProgressDisplay()

    onVolumeChange: (volume)=>
        @currentTrack.setVolume volume

    onToggleMute: =>
        @currentTrack.toggleMute()

    formatMs: (ms)->
        s = Math.floor ((ms/1000) % 60)
        s = "0#{s}" if s < 10
        "#{Math.floor ms/60000}:#{s}"

    updateProgressDisplay: =>
        newWidth = @currentTrack.position/@currentTrack.durationEstimate*100
        @progressInner.width "#{newWidth}%"
        @elapsedTime.html @formatMs(@currentTrack.position)
        remainingTime = @currentTrack.durationEstimate - @currentTrack.position
        @remainingTime.html @formatMs(remainingTime)

    onMouseDownProgress: (event)->
        event.preventDefault()
        handlePositionPx = event.clientX - @progress.offset().left
        percent = handlePositionPx/@progress.width()
        if @currentTrack.durationEstimate*percent < @currentTrack.duration
            @currentTrack.setPosition @currentTrack.durationEstimate*percent
            @updateProgressDisplay()