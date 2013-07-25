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

    subscriptions:
        # when a track is selected or unselected
        "track:click": "onClickTrack"
        "track:unclick": "onUnclickTrack"

    # Called after the constructor
    initialize: ->
        super
        # To handle the sub views.
        @views = {}
        @listenTo @collection, "add", @onCollectionAdd
        @listenTo @collection, "remove", @onCollectionRemove

    # override : new elements are inserted before the others (not after)
    appendView: (view) ->
        @$collectionEl.prepend view.el

    afterRender: ->
        super
        @uploader = @$('#uploader')[0]
        @selectedTrack = null
        @$collectionEl.html '<em>loading...</em>'
        @collection.fetch
            success: (collection, response, option) =>
                @$collectionEl.find('em').remove()
                @$('tr:odd').addClass 'odd'
            error: =>
                msg = "Files couldn't be retrieved due to a server error."
                @$collectionEl.find('em').html msg

    controlFile = (track, cb)=>
        # control file type
        unless track.file.type.match /audio\/(mp3|mpeg)/ # list of supported filetype
            err = "\"#{track.get 'fileName'}\" is of unsupported #{track.file.type} filetype"
        cb(err)

    readMetaData = (track, cb)=>
        # read metadata using a FileReader
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
                tags: ["title","artist","album","track"]
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
            success: ->
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
        @collection.add track
        uploadWorker track, @views[track.cid]

    onClickTrack: (track)=>
        # unselect previous selected track if there is one
        unless @selectedTrack is null
            @selectedTrack.toggleSelect()
        # register selected track
        @selectedTrack = track

    onUnclickTrack: =>
        # unregister selected track
        @selectedTrack = null