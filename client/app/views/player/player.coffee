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

        'track:delete': (soundId) ->
            if @currentSound?.id is soundId
                @stopTrack()

        # these channels are shared with views/player/volumeManager.coffee
        'volumeManager:toggleMute': 'onToggleMute'
        'volumeManager:volumeChanged': 'onVolumeChange'

    initialize: (options)->
        super
        # bind keyboard events
        Mousetrap.bind 'space', @onClickPlay
        Mousetrap.bind 'b', @onClickRwd
        Mousetrap.bind 'n', @onClickFwd

    afterRender: =>
        # bind play button
        @playButton = @$(".button.play")

        # initializing variables related to volumeManager
        @volume = 50 # default volume value
        @isMuted = false

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

    onClickPlay: =>
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
                else if app.playQueue.getCurrentTrack()?
                    if @isStopped
                        @onPlayTrack(app.playQueue.getCurrentTrack())
            else
                alert "application error : unable to play track"

    onClickRwd: =>
        # go to the start of the current sound
        if @currentSound? and not @isStopped and @currentSound.position > 3000
            @currentSound.setPosition 0
            @updateProgressDisplay()
        # get the previous sound
        else
            prevTrack = app.playQueue.getPrevTrack()
            if prevTrack?
                # then play previous track
                @onPlayTrack prevTrack

    onClickFwd: =>
        nextTrack = app.playQueue.getNextTrack()
        if nextTrack?
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

    onQueueTrack: (track)=>
        app.playQueue.queue track
        # autoplay
        if app.playQueue.length is 1
            @onPlayTrack app.playQueue.getCurrentTrack()
        # if current playlist have been play entirely
        else if app.playQueue.length-2 is app.playQueue.atPlay and @isStopped
            @onPlayTrack app.playQueue.getNextTrack()


    onPushNext: (track)=>
        app.playQueue.pushNext track
        # autoplay
        if app.playQueue.length is 1
            @onPlayTrack app.playQueue.getCurrentTrack()
        else if app.playQueue.length-2 is app.playQueue.atPlay and @isStopped
            @onPlayTrack app.playQueue.getNextTrack()

    onPlayImmediate: (track)=>
        app.playQueue.pushNext track
        # if the queue was empty before the above instruction
        if app.playQueue.length is 1
            nextTrack = app.playQueue.getCurrentTrack()
        else
            nextTrack = app.playQueue.getNextTrack()
        # launch newTrack
        @onPlayTrack nextTrack


    onPlayTrack: (track)=>
        # signal other subviews
        Backbone.Mediator.publish 'player:start-sound', track.get('id')
        # stop and destruct previous sound if necessary
        if @currentSound?
            # if this is the same sound, no need to destroy it
            if @currentSound.id is "sound-#{track.get('id')}"
                @currentSound.setPosition 0
                @currentSound.play()
                @updateProgressDisplay()
                return
            # else destroy the current track
            else
                @stopTrack()

        # here @currentSound must be null so we can proceed the track loading
        # loading the track
        @currentSound = app.soundManager.createSound
            id: "sound-#{track.get('id')}"
            url: "tracks/#{track.get('id')}/attach/#{track.get('slug')}"
            usePolicyFile: true
            volume: @volume
            #muted: @isMuted # doesn't seem to work
            autoPlay: true
            onfinish: @onPlayFinish
            onstop: @stopTrack
            whileplaying: @updateProgressDisplay
            # whileloading: @printLoadingInfo # debbugging tool
            # sound "restart" (instead of "chorus") when played multiple times
            multiShot: false
        @currentSound.mute() if @isMuted

        # update display and variables
        @playButton.removeClass("stopped")
        @isStopped = false
        @playButton.removeClass("paused")
        @isPaused = false
        nfo = "#{track.get('title')} - <i>#{track.get('artist')}</i>"
        @$('.id3-info').html nfo

    # at the end of track, play next track
    onPlayFinish: =>
        nextTrack = app.playQueue.getNextTrack()
        if nextTrack?
            @onPlayTrack nextTrack
        # if there is no more track just stop the current one.
        else
            @stopTrack()

    # stop means destroy, this function destroy the sound and update the display
    stopTrack: =>
        # signal other subviews
        Backbone.Mediator.publish 'player:stop-sound'
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
        @isMuted = not @isMuted
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
            app.playQueue.playLoop = true
        else
            app.playQueue.playLoop = false

    onClickRandom: ->
        alert 'not available yet'