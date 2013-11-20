module.exports = class Application

    defaultVolume: 70

    initialize: =>
        # generate titles
        title = document.URL
        $('#title').html "<i class='icon-music'></i> #{title.replace(/\/public\/cozic\/.*$/, '').replace(/^.*:\/\//, '')}"

        # bind the mute function with the button
        $('#mute-button').click (event)=>
            event.preventDefault()
            event.stopPropagation()
            @onMute()

        # initialize soundmanager
        @soundManager = soundManager
        @soundManager.setup
            # disable or enable debug output
            debugMode: false
            debugFlash: false
            useFlashBlock: false
            # always prefer flash even for MP3/MP4 when HTML5 audio is available
            preferFlash: true
            # path to directory containing SM2 SWF
            url: "swf/"
            # optional: enable MPEG-4/AAC support (requires flash 9)
            flashVersion: 9
            onready: =>
                $('#song-info').html "<i class='icon-cog'></i> Requesting server..."
                @getSongUrl()
            ontimeout: =>
                $('#song-info').html "<i class='icon-exclamation-sign'></i> unable to load player"

        @volume = @defaultVolume
        @prevSoundUrl = ""
        @resetTimer()

    # ask the server for a song, launch timer if there is none
    getSongUrl: =>
        # request the server
        console.log "asking server..."
        $.ajax "broadcast",
            type: 'GET'
            error: (jqXHR, textStatus, errorThrown)->
                $('#song-info').html "<i class='icon-exclamation-sign'></i> #{textStatus}: #{errorThrown}"
            success: (data, textStatus, jqXHR)=>
                if textStatus is "nocontent"
                    # no song was found
                    $('#song-info').html "<i class='icon-stop'></i> No song to play yet"
                    @launchTimer()
                else
                    # a song is available
                    if data.url isnt @prevSoundUrl
                        # if this is a new song play it
                        @playSong data
                        @resetTimer()
                    else
                        # if this isn't a new song, wait
                        $('#song-info').html "<i class='icon-stop'></i> No more song to play for now"
                        @launchTimer()

    # play the track targeted by data.url
    playSong: (data)=>
        @prevSoundUrl = data.url
        @currentSound = @soundManager.createSound
            id: "sound"
            url: data.url
            volume: @volume
            autoPlay: true
            onfinish: @onFinish
        $('#song-info').html "<i class='icon-play'></i>  #{data.title} - <i>#{data.artist}</i>"

    # destruct the sound then call getSongUrl
    onFinish: =>
        if @currentSound?
            @currentSound.destruct()
            @currentSound = null
        $('#song-info').html "<i class='icon-stop'></i> Stopped"
        @getSongUrl()

    # update display and mute the current sound if there is one
    onMute: =>
        if @currentSound?
            if @volume is 0
                @currentSound.setVolume @defaultVolume
            else
                @currentSound.setVolume 0
        if @volume is 0
            @volume = @defaultVolume
            $('#mute-button').html "<i class='icon-volume-up'></i> mute"
        else
            @volume = 0
            $('#mute-button').html "<i class='icon-volume-off'></i>&nbsp;&nbsp;unmute"

    # timer management
    resetTimer: =>
        @timeToWait = 1

    launchTimer: =>
        setTimeout ()=>
            @getSongUrl()
        , @timeToWait*1000
        # wait for 1 second then 2, 4, 8, 16 and 32 seconds
        @timeToWait = if @timeToWait >= 32 then 32 else @timeToWait*2
