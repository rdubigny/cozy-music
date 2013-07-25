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
        "click .button.rwd": "onClickRwd"
        "mousedown .progress": "onMouseDownProgress"

    subscriptions:
        # subscribe to the channel shared with views/trackList_item.coffee
        "track:play": "onPlayTrack"
        # subscribe to the channel shared with views/player/volumeManager.coffee
        "volumeManager:toggleMute": "onToggleMute"
        "volumeManager:volumeChanged": "onVolumeChange"

    afterRender: =>

        # bind play button
        @playButton = @$(".button.play")

        # initializing variables related to volumeManager
        @volume = 50 # default volume value
        @isMutted = false

        # create, bind and display the volume bar
        @volumeManager = new VolumeManager({initVol: @volume})
        @volumeManager.render()
        @$('#volume').append @volumeManager.$el

        # bind the progress bar
        @elapsedTime = @$('#elapsedTime')
        @remainingTime = @$('#remainingTime')
        @progress = @$('.progress')
        @progressInner = @$('.progress .inner')

        # initializing variables
        @currentTrack = null
        @progressInner.width "0%"
        @elapsedTime.html "0:00"
        @remainingTime.html "0:00" #@formatMs @currentTrack.durationEstimate
        @isStopped = true
        @isPaused = false

    onClickPlay: ->
        if @currentTrack?
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

    onClickRwd: ->
        if @currentTrack? and not @isStopped
                @currentTrack.setPosition 0
                @updateProgressDisplay()

    onMouseDownProgress: (event)->
        if @currentTrack?
            event.preventDefault()
            handlePositionPx = event.clientX - @progress.offset().left
            percent = handlePositionPx/@progress.width()
            if @currentTrack.durationEstimate*percent < @currentTrack.duration
                @currentTrack.setPosition @currentTrack.durationEstimate*percent
                @updateProgressDisplay()

    onPlayTrack: (id, dataLocation)->
        if @currentTrack?
            @stopTrack()

        #loading the track
        @currentTrack = app.soundManager.createSound
            id: id
            url: dataLocation
            usePolicyFile: true
            volume: @volume
            #muted: @isMutted #doesn't seem to work
            #autoload: true # removed because of a soundManager bug, see below
            onfinish: @stopTrack
            onstop: @stopTrack
            whileplaying: @updateProgressDisplay
        @currentTrack.play() # works better than 'autoload: true'
        @currentTrack.mute() if @isMutted
        @playButton.removeClass("stopped")
        @isStopped = false
        @playButton.removeClass("paused")
        @isPaused = false


    stopTrack: =>
        if @currentTrack?
            @currentTrack.destruct()
            @currentTrack = null
        @playButton.addClass("stopped")
        @isStopped = true
        @playButton.removeClass("paused")
        @isPaused = false
        @progressInner.width "0%"
        @elapsedTime.html "0:00"
        @remainingTime.html "0:00"

    onVolumeChange: (volume)=>
        @volume = volume
        if @currentTrack?
            @currentTrack.setVolume volume

    onToggleMute: =>
        @isMutted = not @isMutted
        if @currentTrack?
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

    id3Fired: (prop, data)=>
        console.log 'sound #{@currentTrack.id} ID3 data received'
        for prop in @currentTrack.id3
            do ->
                console.log '#{prop}: #{@currentTrack.id3[prop]}'