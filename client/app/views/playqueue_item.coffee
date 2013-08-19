TrackListItemView = require './tracklist_item'

module.exports = class PlayQueueItemView extends TrackListItemView

    template: require './templates/playqueue_item'

    events:
        'click .button.delete': 'onDeleteClick'
        'click .button.delete-from-here': 'onDeleteFromHereClick'
        'drop' : 'drop'

    onDeleteClick: (event)=>
        event.preventDefault()
        event.stopPropagation()
         # remove the view without destroying the model
        @$el.trigger 'remove-item', @model

    onDeleteFromHereClick: (event)->
        @$el.trigger 'remove-from-track', @model

    drop: (event, index) ->
        @$el.trigger 'update-sort', [@model, index]