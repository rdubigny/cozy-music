TrackListItemView = require './tracklist_item'

module.exports = class PlayQueueItemView extends TrackListItemView

    template: require './templates/playqueue_item'

    events:
        'click #mini-play-button': 'onPlayClick'
        'click #delete-button': 'onDeleteClick'
        'click #delete-from-here-button': 'onDeleteFromHereClick'
        'drop' : 'drop'

    onPlayClick: (event)=>
        event.preventDefault()
        event.stopPropagation()
        @$el.trigger 'play-from-track', @model

    onDeleteClick: (event)=>
        event.preventDefault()
        event.stopPropagation()
         # remove the view without destroying the model
        @$el.trigger 'remove-item', @model

    onDeleteFromHereClick: (event)->
        @$el.trigger 'remove-from-track', @model

    drop: (event, index) ->
        @$el.trigger 'update-sort', [@model, index]