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

    subscriptions:
        'playQueueItem:remove': (track)->
            @collection.removeItem(track)

    afterRender: ->
        super
        # adding table stripes
        $('.tracks-display tr:odd').addClass 'odd'
        @$('#track-list').sortable
            opacity: 0.8
            delay: 150 # prevent unwanted drags when clicking on an element
            containment: "parent"
            axis: "y"
            placeholder: "track sortable-placeholder"
            tolerance: "pointer"
            helper: (e, tr)->
                $originals = tr.children();
                $helper = tr.clone();
                $helper.children().each (index)->
                    # Set helper cell sizes to match the original sizes
                    $(this).width($originals.eq(index).width())
                return $helper
            stop: (event, ui) ->
                ui.item.trigger 'drop', ui.item.index()

    updateSort: (event, track, position) ->
        @collection.moveItem track, position
        @render()