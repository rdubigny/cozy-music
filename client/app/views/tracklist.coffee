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
        'click .create-button': 'onCreateClicked'

    # Called after the constructor
    initialize: ->
        # When you overrides a method from the superclass, you should consider
        # calling "super()"
        super
        # To handle the sub views.
        @views = {}

    afterRender: ->
        super
        #@uploader = @$('#uploader')
        @$collectionEl.html '<em>loading...</em>'
        @collection.fetch
            success: (collection, response, option) =>
                @$collectionEl.find('em').remove()
            error: =>
                msg = "Files couldn't be retrieved due to a server error."
                @$collectionEl.find('em').html msg

    # Handler for "click" event on the '.create-button'
    onCreateClicked: =>
        # Grab field data
        title = $('.title-field').val()

        # Validate that data are ok.
        if title?.length > 0
            # Data to be used to create the new model
            track =
                title: title

            # Save it through collection, this will automatically add it to the
            # current list when request finishes.
            @collection.create track,
                success: ->
                    alert "Track added."
                    $('.title-field').val ''
                error: -> alert "Server error occured, Track was not saved"
        else
            alert 'Please fill the title field'