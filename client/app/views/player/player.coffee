###
    Here is the player. This is the bridge beetween Soundmanager2 and Cozic.
###
BaseView = require 'lib/base_view'
VolumeManager = require './volumeManager'
app = require 'application'

module.exports = class Player extends BaseView

    className: 'player'
    tagName: 'div'
    template: require('views/templates/player/player')

    events:
        'click #play-button': 'onClickPlay'
        'click #rwd-button': 'onClickRwd'
        'click #fwd-button': 'onClickFwd'
        'mousedown .progress': 'onMouseDownProgress'
        'click #loop-button': 'onClickLoop'
        'click #random-button': 'onClickRandom'

        'soundManager:ready': (e)->
            @isLoading = false
            @canPlay = true
            @updatePlayButtonDisplay()
        'soundManager:timeout': (e)->
            @isLoading = false
            @canPlay = false
            @updatePlayButtonDisplay()

    subscriptions:
        # these events should be fired by tracklist_item view
        'track:queue': 'onQueueTrack'
        'tracks:queue': 'onQueueTrackMultiple'
        'track:pushNext': 'onPushNext'
        'tracks:pushNext': 'onPushNextMultiple'
        'track:playImmediate': 'onPlayImmediate'
        'track:play-from': (track)->
            @onPlayTrack track

        'track:delete': (soundId) ->
            if @currentSound?.id is soundId
                @stopTrack()

        # these channels are shared with views/player/volumeManager.coffee
        'volumeManager:toggleMute': 'onToggleMute'
        'volumeManager:volumeChanged': 'onVolumeChange'

    initialize: (options)->
        @isStopped = true
        @isPaused = false
        @canPlay = false
        @isLoading = true
        super
        # bind keyboard events
        Mousetrap.bind 'space', @onClickPlay
        Mousetrap.bind 'b', @onClickRwd
        Mousetrap.bind 'n', @onClickFwd

    afterRender: =>
        super
        # bind play button
        @playButton = @$('#play-button')

        # initializing variables related to volumeManager
        if Cookies('defaultVolume')?
            @volume = parseInt(Cookies('defaultVolume'))
        else
            @volume = 50
        @isMuted = Cookies('isMuteByDefault')? and Cookies('isMuteByDefault') is "true"

        # create, bind and display the volume bar
        @volumeManager = new VolumeManager
            initVol: @volume
            initMute: @isMuted
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

        @updatePlayButtonDisplay()

    updatePlayButtonDisplay: =>
        icon = @$('#play-button i')
        icon.removeClass 'icon-warning-sign icon-play icon-pause icon-cogs'
        icon.removeClass 'activated'
        if @isLoading
            icon.addClass 'icon-cogs'
        else if not @canPlay
            icon.addClass 'icon-warning-sign activated'
        else if @isStopped or @isPaused
            icon.addClass 'icon-play'
        else
            icon.addClass 'icon-pause'

    onClickPlay: =>
        if not @isLoading
            if @canPlay
                if @currentSound?
                    if @isStopped
                        @currentSound.play()
                        @isStopped = false
                    else if @isPaused
                        @currentSound.play()
                        @isPaused = false
                    else if not @isPaused and not @isStopped # <=> isPlaying
                        @currentSound.pause()
                        @isPaused = true
                else if app.playQueue.getCurrentTrack()?
                    if @isStopped
                        @onPlayTrack(app.playQueue.getCurrentTrack())
                #if there is no tracks in the queue play the entire library
                else if app.playQueue.length is 0
                    app.tracks.each (track)=>
                        if track.attributes.state is 'server'
                            @onQueueTrack track
                @updatePlayButtonDisplay()
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
        # if it's the current sound do nothing
        if @currentSound?.id is "sound-#{track.get('id')}"
            return
        app.playQueue.queue track
        # autoplay
        if app.playQueue.length is 1
            @onPlayTrack app.playQueue.getCurrentTrack()
        # if current playlist have been play entirely
        else if app.playQueue.length-2 is app.playQueue.atPlay and @isStopped
            @onPlayTrack app.playQueue.getNextTrack()

    onQueueTrackMultiple: (tracks)=>
        for track in tracks
            @onQueueTrack track

    onPushNext: (track)=>
        # if it's the current sound do nothing
        if @currentSound?.id is "sound-#{track.get('id')}"
            return
        app.playQueue.pushNext track
        # autoplay
        if app.playQueue.length is 1
            @onPlayTrack app.playQueue.getCurrentTrack()
        else if app.playQueue.length-2 is app.playQueue.atPlay and @isStopped
            @onPlayTrack app.playQueue.getNextTrack()


    onPushNextMultiple: (tracks)=>
        pq = app.playQueue
        # in case autoplay is triggered for pushed tracks
        # we need to push the first track then reverse the remaining tracks
        if pq.length is 0 or (pq.length-1 is pq.atPlay and @isStopped)
            @onPushNext tracks.shift()
        tracks.reverse()
        for track in tracks
            @onPushNext track

    onPlayImmediate: (track)=>
        # if it's the current sound just call playTrack on it
        if @currentSound?.id is "sound-#{track.get('id')}"
            nextTrack = track
        # else fetch the playqueue
        else
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
            volume: @volumeFilter(@volume)
            #muted: @isMuted # doesn't seem to work
            autoPlay: true
            onfinish: @onPlayFinish
            onstop: @stopTrack
            whileplaying: @updateProgressDisplay
            #whileloading: @printLoadingInfo # debbugging tool
            # sound "restart" (instead of "chorus") when played multiple times
            multiShot: false
            #onid3: ()-> console.log @id3 # may be useful in the future
        @currentSound.mute() if @isMuted

        # update display and variables
        @isStopped = false
        @isPaused = false
        @updatePlayButtonDisplay()
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
        @isStopped = true
        @isPaused = false
        @updatePlayButtonDisplay()
        @progressInner.width "0%"
        @elapsedTime.html "&nbsp;0:00"
        @remainingTime.html "&nbsp;0:00"
        @$('.id3-info').html "-"

    # volumeChange handler, it just tells soundManager the new volume value
    onVolumeChange: (volume)=>
        @volume = volume
        Cookies.set 'defaultVolume', volume
        if @currentSound?
            @currentSound.setVolume @volumeFilter(volume)

    # volume change should be more significant with that
    volumeFilter: (volume)=>
        # the formula is x->(x*0.01)^2*100+1
        newVol = volume*0.01
        newVol = newVol*newVol # turn linear into quadratic
        newVol = newVol*100 + 1 # so the volume can't be 0
        return newVol

    # on mute handler, same thing but for the muted value
    onToggleMute: =>
        @isMuted = not @isMuted
        Cookies.set 'isMuteByDefault', "#{@isMuted}"
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
        bl = Math.floor(@currentSound.bytesLoaded/@currentSound.bytesTotal*100)
        unless @bytesLoaded?
            @bytesLoaded = -1
        if @bytesLoaded isnt bl
            @bytesLoaded = bl
            tot = @currentSound.durationEstimate
            console.log "is buffering : #{@currentSound.isBuffering}"
            console.log "buffered :"
            printBuf = (buf)=>
                console.log "[#{Math.floor(buf.start/tot*100)}% - #{Math.floor(buf.end/tot*100)}%]"
            printBuf @currentSound.buffered[i] for buf, i in @currentSound.buffered
            console.log "bytes loaded : #{bl}"
            console.log ""
        else
            console.log "refresh"

    # update both left and right timers and the progress bar
    updateProgressDisplay: =>
        newWidth = @currentSound.position/@currentSound.durationEstimate*100
        @progressInner.width "#{newWidth}%"
        @elapsedTime.html @formatMs(@currentSound.position)
        remainingTime = @currentSound.durationEstimate - @currentSound.position
        @remainingTime.html @formatMs(remainingTime)

    onClickLoop: ->
        loopIcon = @$('#loop-button i')
        if loopIcon.hasClass 'icon-refresh'
            # currently in repeat-all mode
            if loopIcon.hasClass 'activated'
                app.playQueue.playLoop = 'repeat-one'
                loopIcon.toggleClass 'activated'
                loopIcon.toggleClass 'icon-refresh icon-repeat activated'
            # currently in no-repeat mode
            else
                app.playQueue.playLoop = 'repeat-all'
                loopIcon.toggleClass 'activated'
        # currently in repeat-one mode
        else
            app.playQueue.playLoop = 'no-repeat'
            loopIcon.toggleClass 'icon-refresh icon-repeat activated'

    onClickRandom: ->
        app.playQueue.randomize()