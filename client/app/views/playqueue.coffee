###
    added for this list :
        - drag and drop
###

TrackView = require './playqueue_item'
TrackListView = require './tracklist'

module.exports = class PlayQueueView extends TrackListView

    itemview: TrackView

    subscriptions:
        'playQueueItem:remove': (track)->
            @collection.removeItem(track)

    afterRender: ->
        super
        # adding table stripes
        $('.tracks-display tr:odd').addClass 'odd'

