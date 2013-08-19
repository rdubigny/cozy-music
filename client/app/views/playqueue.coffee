###
    added for this list :
        - drag and drop
###

TrackView = require './playqueue_item'
TrackListView = require './tracklist'

module.exports = class PlayQueueView extends TrackListView

    itemview: TrackView

    events:
        'update-sort': 'updateSort'
        'remove-item': (e, track)->
            @collection.remove track
        'remove-from-track': 'removeFromTrack'
        'click .save-button': (e)->
            alert 'not available yet'
        'click .show-prev-button': 'onClickShowPrevious'

    #subscriptions:
        #'player:start-sound': 'renderPlayQueue'
        #'player:stop-sound': (e) =>
        #    $('.at-play').removeClass('at-play')

    renderPlayQueue: =>
        @render()

    showPrevious: false

    initialize: ->
        super
        @views = {}

    afterRender: =>
        super
        # adding table stripes
        $('.tracks-display tr:odd').addClass 'odd'

        # update track status display
        for id, view of @views
            index = @collection.indexOf view.model
            if index < @collection.atPlay
                if @showPrevious
                    view.$el.addClass 'already-played'
                else
                    view.$el.addClass 'hidden'
            else if index is @collection.atPlay
                view.$el.addClass 'at-play'

        # adding save button & show previous tracks
        saveButton = $(document.createElement('div'))
        saveButton.addClass('thead-button save-button')
        @$('th.left').append saveButton
        showPrevButton = $(document.createElement('div'))
        showPrevButton.addClass('thead-button show-prev-button')
        @$('th.left').append showPrevButton

        # enabling drag'n'drop with jquery-ui-1.10.3
        @$('#track-list').sortable
            opacity: 0.8
            delay: 150 # prevent unwanted drags when clicking on an element
            containment: "parent"
            axis: "y"
            placeholder: "track sortable-placeholder"
            # tolerance: "pointer"
            # to prevent table.th width to collapse, we need to override helper
            helper: (e, tr)->
                $originals = tr.children();
                $helper = tr.clone();
                $helper.children().each (index)->
                    # Set helper cell sizes to match the original sizes
                    $(this).width($originals.eq(index).width())
                return $helper
            # when drag'n'drop stop we need to update the collection
            stop: (event, ui) ->
                ui.item.trigger 'drop', ui.item.index()

    updateSort: (event, track, position) ->
        @collection.moveItem track, position
        @render()

    removeFromTrack: (event, track)->
        index = @collection.indexOf(track)
        @collection.deleteFromIndexToEnd index
        @render()

    onClickShowPrevious: (e)=>
            @showPrevious = !@showPrevious
            @render()
