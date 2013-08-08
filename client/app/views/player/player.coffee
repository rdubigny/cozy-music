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
        # these channels are shared with views/trackList_item.coffee
        "track:play": "onPlayTrack"
        "track:stop": (id) ->
            if @currentTrack?.id is id
                @stopTrack()

        # these channels are shared with views/player/volumeManager.coffee
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
        @elapsedTime.html "&nbsp;0:00"
        @remainingTime.html "&nbsp;0:00"
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

    onPlayTrack: (data)->
        if @currentTrack?
            # if this is the same track there is no need to destruct the song
            # then recreate it. Set the position to zero is enough.
            if @currentTrack.id is data.id
                @currentTrack.setPosition 0
                @updateProgressDisplay()
                return
            # else destroy the current track
            @stopTrack()

        # here @currentTrack is null, we can proceed the track loading
        # loading the track
        @currentTrack = app.soundManager.createSound
            id: data.id
            url: data.dataLocation
            usePolicyFile: true
            volume: @volume
            #muted: @isMutted # doesn't seem to work
            #autoload: true # removed because of a soundManager bug, see below
            onfinish: @stopTrack
            onstop: @stopTrack
            whileplaying: @updateProgressDisplay
            # whileloading: @printLoadingInfo # debbugging tool
            # sound "restart" (instead of "chorus") when played multiple times
            multiShot: false
        @currentTrack.play() # works better than 'autoload: true'
        @currentTrack.mute() if @isMutted

        # update display and variables
        @playButton.removeClass("stopped")
        @isStopped = false
        @playButton.removeClass("paused")
        @isPaused = false

        @$('.id3-info').html "#{data.title} - <i>#{data.artist}</i>"

    # stop means destroy, this function destroy the track and update the display
    stopTrack: =>
        if @currentTrack?
            @currentTrack.destruct()
            @currentTrack = null
        @playButton.addClass("stopped")
        @isStopped = true
        @playButton.removeClass("paused")
        @isPaused = false
        @progressInner.width "0%"
        @elapsedTime.html "&nbsp;0:00"
        @remainingTime.html "&nbsp;0:00"
        @$('.id3-info').html "-"

    # volumeChange handler, it just tells soundManager the new volume value
    onVolumeChange: (volume)=>
        @volume = volume
        if @currentTrack?
            @currentTrack.setVolume volume

    # on mute handler, same thing but for the muted value
    onToggleMute: =>
        @isMutted = not @isMutted
        if @currentTrack?
            @currentTrack.toggleMute()

    # transform milliseconds to a cool readable string format : "mm:ss" or " m:ss"
    formatMs: (ms)->
        s = Math.floor ((ms/1000) % 60)
        s = "0#{s}" if s < 10
        m = Math.floor ms/60000
        m = "&nbsp;#{m}" if m < 10
        "#{m}:#{s}"

    # debugging function : to delete
    printLoadingInfo: =>
        tot = @currentTrack.durationEstimate
        console.log "is buffering : #{@currentTrack.isBuffering}"
        console.log "buffered :"
        printBuf = (buf)=>
            console.log "[#{Math.floor(buf.start/tot*100)}% - #{Math.floor(buf.end/tot*100)}%]"
        printBuf @currentTrack.buffered[i] for buf, i in @currentTrack.buffered
        console.log "bytes loaded : #{Math.floor(@currentTrack.bytesLoaded/@currentTrack.bytesTotal*100)}"
        console.log ""

    # update both left and right timers and the progress bar
    updateProgressDisplay: =>
        newWidth = @currentTrack.position/@currentTrack.durationEstimate*100
        @progressInner.width "#{newWidth}%"
        @elapsedTime.html @formatMs(@currentTrack.position)
        remainingTime = @currentTrack.durationEstimate - @currentTrack.position
        @remainingTime.html @formatMs(remainingTime)