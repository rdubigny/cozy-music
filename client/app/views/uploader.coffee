BaseView = require '../lib/base_view'
Track = require '../models/track'
app = require '../../application'

module.exports = class Uploader extends BaseView

    className: 'uploader'
    tagName: 'div'
    template: require('./templates/uploader')

    # Register listener
    events:
        'click #upload-form' : 'onClick'
        'click #youtube-import' : 'onClickYoutube'


    subscriptions:
        'tracklist:isEmpty': 'onEmptyTrackList'

    afterRender: ->
        @setupHiddenFileInput()

    onEmptyTrackList: ->
        @$('td#h2').html "Drop files here or click to add tracks"

    setupHiddenFileInput: =>
        document.body.removeChild @hiddenFileInput if @hiddenFileInput
        # create a hidden input file and append it at the end of the document
        @hiddenFileInput = document.createElement "input"
        @hiddenFileInput.setAttribute "type", "file"
        @hiddenFileInput.setAttribute "multiple", "multiple"
        @hiddenFileInput.setAttribute "accept", "audio/*"
        # Not setting `display="none"` because some browsers don't accept clicks
        # on elements that aren't displayed.
        @hiddenFileInput.style.visibility = "hidden"
        @hiddenFileInput.style.position = "absolute"
        @hiddenFileInput.style.top = "0"
        @hiddenFileInput.style.left = "0"
        @hiddenFileInput.style.height = "0"
        @hiddenFileInput.style.width = "0"
        document.body.appendChild @hiddenFileInput
        @hiddenFileInput.addEventListener "change", @onUploadFormChange

    onUploadFormChange: (event)=>
        # fetch files
        @handleFiles @hiddenFileInput.files

        # clear input field
        @setupHiddenFileInput()

    onClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        # Forward the click
        @hiddenFileInput.click()

    # event listeners for D&D events
    onFilesDropped: (event) =>
        event.preventDefault()
        event.stopPropagation()
        @$el.removeClass 'dragover'
        $('.player').removeClass 'dragover'
        # fetch files
        event.dataTransfer = event.originalEvent.dataTransfer
        @handleFiles event.dataTransfer.files

    onDragOver: (event) =>
        event.preventDefault() # allow drop
        event.stopPropagation()
        unless @$el.hasClass 'dragover'
            @$el.addClass 'dragover'
            $('.player').addClass 'dragover'

    onDragOut: (event) =>
        event.preventDefault() # allow drop
        event.stopPropagation()
        if @$el.hasClass 'dragover'
            @$el.removeClass 'dragover'
            $('.player').removeClass 'dragover'

    # control file type
    controlFile = (track, cb)=>
        # here soundManager.canPlayLink track.file will be good
        # but it doesn't work with audio/mp4 on chrome
        unless track.file.type.match /audio\/(mp3|mpeg)/ # list of supported filetype
            err = "unsupported #{track.file.type} filetype"
        cb(err)

    # read metadata using a FileReader
    readMetaData = (track, cb)=>
        url = track.get 'title'
        reader = new FileReader()
        reader.onload = (event)=>
            ID3.loadTags url, (=>
                tags = ID3.getAllTags url
                track.set
                    title: if tags.title? then tags.title else url
                    artist: if tags.artist? then tags.artist else ''
                    album: if tags.album? then tags.album else ''
                    track: if tags.track? then tags.track else ''
                    year: if tags.year? then tags.year else ''
                    genre: if tags.genre? then tags.genre else ''
                    time: if tags.TLEN?.data? then tags.TLEN.data else ''
                cb()
            ),
                tags: ["title","artist","album","track","year","genre","TLEN"]
                dataReader: FileAPIReader track.file
        reader.readAsArrayBuffer track.file
        reader.onabort = (event)=>
            cb "unable to read metadata"

    # create a FormData object
    # save the model
    upload = (track, cb) =>
        formdata = new FormData()
        formdata.append 'cid', track.cid
        formdata.append 'title', track.get 'title'
        formdata.append 'artist', track.get 'artist'
        formdata.append 'album', track.get 'album'
        formdata.append 'track', track.get 'track'
        formdata.append 'year', track.get 'year'
        formdata.append 'genre', track.get 'genre'
        formdata.append 'time', track.get 'time'
        formdata.append 'file', track.file

        # if the upload have been canceled don't proceed to upload
        # return the callback with an error to stop the waterfall
        if track.attributes.state is 'canceled'
            return cb "upload canceled"

        track.set
            state: 'uploadStart'

        track.sync 'create', track,
            processData: false # tell jQuery not to process the data
            contentType: false # tell jQuery not to set contentType (Prevent $.ajax from being smart)
            data: formdata
            success: (model)->
                track.set model # to get the generated id
                cb()
            error: ->
                cb("upload failed")

        false # There is no reasons for this
        # I just didn't want to return the function above. Just in case...

    refreshDisplay = (track, cb) =>
        track.set
            state: 'uploadEnd'
        cb()

    uploadWorker = (track, done)=>
        async.waterfall [
            (cb) -> controlFile track, cb
            (cb) -> readMetaData track, cb
            (cb) -> upload track, cb
            (cb) -> refreshDisplay track, cb
        ], (err) ->
            if err
                done "#{track.get('title')} not uploaded properly : #{err}", track
            else
                done()

    # upload 3 by 3
    uploadQueue: async.queue uploadWorker, 3

    handleFiles: (files)=>
        # if not on home, go to home
        curUrl = "#{document.URL}"
        if curUrl.match(/playlist/) or curUrl.match(/playqueue/)
            app.router.navigate '', true
        # signal trackList view
        Backbone.Mediator.publish 'uploader:addTracks'
        # handle files
        for file in files
            fileAttributes = {}
            fileAttributes =
                title: file.name
                artist: ""
                album: ""
            track = new Track fileAttributes
            track.file = file
            app.tracks.unshift track,
                sort: false
            track.set
                state: 'client'
            Backbone.Mediator.publish 'uploader:addTrack'

            @uploadQueue.push track , (err, track) =>
                if err
                    console.log err
                    # remove the track(it's already done if upload was canceled)
                    app.tracks.remove track

    onClickYoutube: (e) =>
        defaultMsg = "Please enter a youtube url :"
        defaultVal = "http://www.youtube.com/watch?v=KMU0tzLwhbE"
        isValidInput = false
        until isValidInput
            input = prompt defaultMsg, defaultVal
            # if user canceled the operation
            return unless input?
            # if https then turn it into http
            if input.match /^https/
                input = input.replace /^https:\/\//i, 'http://'
            if input.match /^http:\/\/www.youtube.com\/watch?/
                startIndex = input.search(/v=/) + 2
                isValidInput = true
                youId = input.substr startIndex, 11
            else if input.match /^http:\/\/youtu.be\//
                isValidInput = true
                youId = input.substr 16, 11
            else if input.length is 11
                isValidInput = true
                youId = input
            defaultMsg = "Invalid youtube url, please try again :"
            defaultVal = input

        # if not on home, go to home
        curUrl = "#{document.URL}"
        if curUrl.match(/playlist/) or curUrl.match(/playqueue/)
            app.router.navigate '', true

        fileAttributes = {}
        fileAttributes =
            title: "fetching youtube-mp3.org ..."
            artist: ""
            album: ""
        track = new Track fileAttributes
        app.tracks.unshift track,
            sort: false
        track.set
            state: 'importBegin'
        Backbone.Mediator.publish 'uploader:addTrack'
        Backbone.ajax
            dataType: "json"
            url: "you/#{youId}"
            context: this
            data: ""
            success: (model)=>
                track.set model # to get the generated id
                track.set
                    state: 'uploadEnd'
            error: (xhr, status, error)=>
                app.tracks.remove track
                beg = "Youtube import #{status}"
                end = "Import was cancelled."
                if xhr.responseText isnt ""
                    alert "#{beg} : #{xhr.responseText}. #{end}"
                else
                    alert "#{beg}. #{end}"