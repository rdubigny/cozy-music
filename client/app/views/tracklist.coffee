BaseView = require '../lib/base_view'
TrackView = require './tracklist_item'
Track = require '../models/track'
ViewCollection = require '../lib/view_collection'

module.exports = class TrackListView extends ViewCollection

    className: 'tracks-display'
    tagName: 'div'
    template: require('./templates/tracklist')
    itemview: TrackView
    collectionEl: '#track-list'
    # Register listener
    events:
        'change #uploader' : 'handleFile'
        'click th.field.title': (event)->
            @onClickTableHead event, 'title'
        'click th.field.artist': (event)->
            @onClickTableHead event, 'artist'
        'click th.field.album': (event)->
            @onClickTableHead event, 'album'

    subscriptions:
        # when a track is selected or unselected
        'track:click': 'onClickTrack'
        'track:unclick': 'onUnclickTrack'

    initialize: ->
        super
        @toggleSort 'artist' # default value : sort by artist

        # specify the current sorting mode
        @elementSort = null
        @isReverseOrder= false

        # always render after sorting (except for the first sort)
        @listenTo @collection, 'sort', @render

    # manage sortArrow display according to elementSort & isReverseOrder values
    updateSortingDisplay: =>
        # remove old arrow
        @$('.sortArrow').remove()

        # if elementSort is null, don't display sorting
        if @elementSort?
            # create a new arrow
            newArrow = $(document.createElement('div'))
            if @isReverseOrder
                newArrow.addClass('sortArrow up')
            else
                newArrow.addClass('sortArrow down')

            # append it in the document
            @$('th.field.'+@elementSort).append newArrow

    afterRender: ->
        super
        @uploader = @$('#uploader')[0]
        @selectedTrack = null
        $('.tracks-display tr:odd').addClass 'odd'
        @updateSortingDisplay()

    # control file type
    controlFile = (track, cb)=>
        unless track.file.type.match /audio\/(mp3|mpeg)/ # list of supported filetype
            err = "\"#{track.get 'fileName'}\" is of unsupported #{track.file.type} filetype"
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
                cb()
            ),
                tags: ['title','artist','album','track']
                dataReader: FileAPIReader track.file
        reader.readAsArrayBuffer track.file
        reader.onabort = (event)=>
            cb("unable to read \"#{url}\"")

    # create a FormData object
    # save the model
    upload = (track, trackview, cb) =>
        formdata = new FormData()
        formdata.append 'cid', track.cid
        formdata.append 'title', track.get 'title'
        formdata.append 'artist', track.get 'artist'
        formdata.append 'album', track.get 'album'
        formdata.append 'track',track.get 'track'
        formdata.append 'file', track.file

        trackview.startUpload()
        track.sync 'create', track,
            processData: false # tell jQuery not to process the data
            contentType: false # tell jQuery not to set contentType (Prevent $.ajax from being smart)
            data: formdata
            sort: false # doesn't work
            success: (model)->
                track.set model # useful to get the generated id
                cb()
            error: ->
                cb("upload failed")

    refreshDisplay = (track, trackview, cb) =>
        trackview.endUpload()
        cb()

    uploadWorker = (track, trackview)=>
        async.waterfall [
            (cb) -> controlFile track, cb
            (cb) -> readMetaData track, cb
            (cb) -> upload track, trackview, cb
            (cb) -> refreshDisplay track, trackview, cb
        ], (err) ->
            if err
                alert "file not loaded properly : #{err}"

    handleFile: (event)=>
        attach = @uploader.files[0]
        fileAttributes = {}
        fileAttributes.title = attach.name
        track = new Track fileAttributes
        track.file = attach
        track.set
            onServer: false
        @collection.unshift track,
            sort: false
        uploadWorker track, @views[track.cid]

    onClickTableHead: (event, element) =>
        event.preventDefault()
        event.stopPropagation()
        @toggleSort element


    toggleSort: (element)=>
        # sort by 'element' in alphabetical order
        # update variables for displaying
        if @elementSort is element
            @isReverseOrder = not @isReverseOrder
        else
            @isReverseOrder = false

        @elementSort = element

        if element is 'title'
            elementArray = ['title', 'artist', 'album', 'track']
        else if element is 'artist'
            elementArray = ['artist', 'album', 'track', 'title']
        else if element is 'album'
            elementArray = ['album', 'track', 'title', 'artist']
        else
            elementArray = [element, null, null, null]

        # override the comparator function
        if @isReverseOrder
            @collection.comparator = (t1, t2)->
                return -1 if t1.get(elementArray[0]) > t2.get(elementArray[0])
                return 1 if t1.get(elementArray[0]) < t2.get(elementArray[0])
                return -1 if t1.get(elementArray[1]) > t2.get(elementArray[1])
                return 1 if t1.get(elementArray[1]) < t2.get(elementArray[1])
                return -1 if t1.get(elementArray[2]) > t2.get(elementArray[2])
                return 1 if t1.get(elementArray[2]) < t2.get(elementArray[2])
                return -1 if t1.get(elementArray[3]) > t2.get(elementArray[3])
                return 1 if t1.get(elementArray[3]) < t2.get(elementArray[3])
                0
        else
            @collection.comparator = (t1, t2)->
                return -1 if t1.get(elementArray[0]) < t2.get(elementArray[0])
                return 1 if t1.get(elementArray[0]) > t2.get(elementArray[0])
                return -1 if t1.get(elementArray[1]) < t2.get(elementArray[1])
                return 1 if t1.get(elementArray[1]) > t2.get(elementArray[1])
                return -1 if t1.get(elementArray[2]) < t2.get(elementArray[2])
                return 1 if t1.get(elementArray[2]) > t2.get(elementArray[2])
                return -1 if t1.get(elementArray[3]) < t2.get(elementArray[3])
                return 1 if t1.get(elementArray[3]) > t2.get(elementArray[3])
                0

        @collection.sort()

    onClickTrack: (track)=>
        # unselect previous selected track if there is one
        unless @selectedTrack is null
            @selectedTrack.toggleSelect()
        # register selected track
        @selectedTrack = track

    onUnclickTrack: =>
        # unregister selected track
        @selectedTrack = null

    onCollectionSort: ->
        console.log "the collection have been sorted"