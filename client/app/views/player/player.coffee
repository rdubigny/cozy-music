###
Here is the player with some freaking awesome features like play and pause...
###
BaseView = require '../../lib/base_view'
VolumeManager = require './volumeManager'
app = require '../../application'

module.exports = class Player extends BaseView

    className: 'player'
    tagName: 'div'
    template: require('../templates/player/player')

    events:
        'click .button.play': 'onClickPlay'
        'click .button.rwd': 'onClickRwd'
        'click .button.fwd': 'onClickFwd'
        'mousedown .progress': 'onMouseDownProgress'
        'click .loop': 'onClickLoop'
        'click .random': 'onClickRandom'

    subscriptions:
        # these events should be fired by tracklist_item view
        'track:queue': 'onQueueTrack'
        'track:playImmediate': 'onPlayImmediate'
        'track:pushNext': 'onPushNext'

        'track:stop': (id) ->
            if @currentSound?.id is id
                @stopTrack()

        # these channels are shared with views/player/volumeManager.coffee
        'volumeManager:toggleMute': 'onToggleMute'
        'volumeManager:volumeChanged': 'onVolumeChange'

        # keyboard events
        'keyboard:keypress' : (e)->
            switch e.keyCode
                when 32 then @onClickPlay() # spacebar
                when 98 then @onClickRwd() # "B" key
                when 110 then @onClickFwd() # "N" key

    afterRender: =>
        # create play queue
        PlayQueue = require 'collections/playqueue'
        @playQueue = new PlayQueue()

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
        @currentSound = null
        @progressInner.width "0%"
        @elapsedTime.html "&nbsp;0:00"
        @remainingTime.html "&nbsp;0:00"
        @isStopped = true
        @isPaused = false

    onClickPlay: ->
        if not @playButton.hasClass 'loading'
            if not @playButton.hasClass 'unplayable'
                if @currentSound?
                    if @isStopped
                        @currentSound.play()
                        @playButton.removeClass("stopped")
                        @isStopped = false
                    else if @isPaused
                        @currentSound.play()
                        @playButton.removeClass("paused")
                        @isPaused = false
                    else if not @isPaused and not @isStopped # <=> isPlaying
                        @currentSound.pause()
                        @playButton.addClass("paused")
                        @isPaused = true
                else if @playQueue.getCurrentTrack()?
                    if @isStopped
                        @playButton.removeClass("stopped")
                        @isStopped = false
                        @onPlayTrack(@playQueue.getCurrentTrack())
            else
                alert "application error : unable to play track"

    onClickRwd: ->
        # go to the start of the current sound
        if @currentSound? and not @isStopped and @currentSound.position > 3000
            @currentSound.setPosition 0
            @updateProgressDisplay()
        # get the previous sound
        else
            prevTrack = @playQueue.getPrevTrack()
            if prevTrack?
                # stop and destruct sound
                @stopTrack()
                # then play previous track
                @onPlayTrack prevTrack

    onClickFwd: ->
        nextTrack = @playQueue.getNextTrack()
        if nextTrack?
            # stop and destruct sound
            @stopTrack()
            # then play next track
            @onPlayTrack nextTrack


    onMouseDownProgress: (event)->
        if @currentSound?
            event.preventDefault()
            handlePositionPx = event.clientX - @progress.offset().left
            percent = handlePositionPx/@progress.width()
            if @currentSound.durationEstimate*percent < @currentSound.duration
                @currentSound.setPosition @currentSound.durationEstimate*percent
                @updateProgressDisplay()

    onQueueTrack: (track)->
        @playQueue.queue track
        if @playQueue.length is 1
            nextTrack = @playQueue.getCurrentTrack()
            @onPlayTrack nextTrack

    onPushNext: (track)->
        @playQueue.pushNext track
        if @playQueue.length is 1
            nextTrack = @playQueue.getCurrentTrack()
            @onPlayTrack nextTrack

    onPlayImmediate: (track)->
        @playQueue.pushNext track
        # if the queue was empty before the above instruction
        if @playQueue.length is 1
            nextTrack = @playQueue.getCurrentTrack()
        else
            nextTrack = @playQueue.getNextTrack()
            # stop and destruct previous sound
            if @currentSound?
                # if this is the same sound, no need to destroy it
                if @currentSound.id is "sound-#{nextTrack.get('id')}"
                    @currentSound.setPosition 0
                    @updateProgressDisplay()
                    return
                # else destroy the current track
                @stopTrack()
        # launch newTrack
        @onPlayTrack(nextTrack)

    onPlayTrack: (track)->
        # here @currentSound must be null so we can proceed the track loading
        # loading the track
        @currentSound = app.soundManager.createSound
            id: "sound-#{track.get('id')}"
            url: "tracks/#{track.get('id')}/attach/#{track.get('slug')}"
            usePolicyFile: true
            volume: @volume
            #muted: @isMutted # doesn't seem to work
            autoPlay: true
            onfinish: =>
                # stop and destruct sound
                @stopTrack()
                # then play next track
                nextTrack = @playQueue.getNextTrack()
                if nextTrack?
                    @onPlayTrack(nextTrack)
            onstop: @stopTrack
            whileplaying: @updateProgressDisplay
            # whileloading: @printLoadingInfo # debbugging tool
            # sound "restart" (instead of "chorus") when played multiple times
            multiShot: false
        @currentSound.mute() if @isMutted

        # update display and variables
        @playButton.removeClass("stopped")
        @isStopped = false
        @playButton.removeClass("paused")
        @isPaused = false
        nfo = "#{track.get('title')} - <i>#{track.get('artist')}</i>"
        @$('.id3-info').html nfo

    # stop means destroy, this function destroy the sound and update the display
    stopTrack: =>
        if @currentSound?
            @currentSound.destruct()
            @currentSound = null
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
        if @currentSound?
            @currentSound.setVolume volume

    # on mute handler, same thing but for the muted value
    onToggleMute: =>
        @isMutted = not @isMutted
        if @currentSound?
            @currentSound.toggleMute()

    # convert milliseconds to a cool readable string format : "mm:ss" or " m:ss"
    formatMs: (ms)->
        s = Math.floor ((ms/1000) % 60)
        s = "0#{s}" if s < 10
        m = Math.floor ms/60000
        m = "&nbsp;#{m}" if m < 10
        "#{m}:#{s}"

    # debugging function : to delete
    printLoadingInfo: =>
        tot = @currentSound.durationEstimate
        console.log "is buffering : #{@currentSound.isBuffering}"
        console.log "buffered :"
        printBuf = (buf)=>
            console.log "[#{Math.floor(buf.start/tot*100)}% - #{Math.floor(buf.end/tot*100)}%]"
        printBuf @currentSound.buffered[i] for buf, i in @currentSound.buffered
        console.log "bytes loaded : #{Math.floor(@currentSound.bytesLoaded/@currentSound.bytesTotal*100)}"
        console.log ""

    # update both left and right timers and the progress bar
    updateProgressDisplay: =>
        newWidth = @currentSound.position/@currentSound.durationEstimate*100
        @progressInner.width "#{newWidth}%"
        @elapsedTime.html @formatMs(@currentSound.position)
        remainingTime = @currentSound.durationEstimate - @currentSound.position
        @remainingTime.html @formatMs(remainingTime)

    onClickLoop: ->
        loopButton = @$('.loop')
        loopButton.toggleClass('on')
        if loopButton.hasClass('on')
            @playQueue.playLoop = true
        else
            @playQueue.playLoop = false

    onClickRandom: ->
        alert 'unavailable yet'