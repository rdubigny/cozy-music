BaseView = require '../lib/base_view'
TrackView = require './tracklist_item'
Track = require '../models/track'
ViewCollection = require '../lib/view_collection'

module.exports = class TrackListView extends ViewCollection

    className: 'tracks-display'
    template: require('./templates/tracklist')
    itemview: TrackView
    collectionEl: '#track-list'
    # Register listener
    events:
        'change #uploader' : 'addFile'

    # Called after the constructor
    initialize: ->
        # When you overrides a method from the superclass, you should consider
        # calling "super()"
        super
        # To handle the sub views.
        @views = {}

    afterRender: ->
        super
        @uploader = @$('#uploader')[0]
        @$collectionEl.html '<em>loading...</em>'
        @collection.fetch
            success: (collection, response, option) =>
                @$collectionEl.find('em').remove()
            error: =>
                msg = "Files couldn't be retrieved due to a server error."
                @$collectionEl.find('em').html msg


    addFile: ()=>
        attach = @uploader.files[0]
        fileAttributes = {}
        fileAttributes.title = attach.name
        track = new Track fileAttributes
        track.file = attach
        @collection.add track
        @upload track

    # create a FormData object
    # save the model
    upload: (track) =>
        formdata = new FormData()
        formdata.append 'cid', track.cid
        formdata.append 'title', track.get 'title'
        formdata.append 'file', track.file
        # need to call sync directly so we can change the data
        Backbone.sync 'create', track,
            contentType:false # Prevent $.ajax from being smart
            data: formdata