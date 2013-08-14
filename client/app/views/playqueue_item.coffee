TrackListItemView = require './tracklist_item'

module.exports = class PlayQueueItemView extends TrackListItemView

    template: require './templates/playqueue_item'

    events:
        'click .button.delete': 'onDeleteClick'
        'drop' : 'drop'

    onDeleteClick: (event)=>
        event.preventDefault()
        event.stopPropagation()

        # signal player if this track is at play
        id = @model.attributes.id
        # then signal player
        Backbone.Mediator.publish 'track:delete', "sound-#{id}"
        # signal trackList view
        Backbone.Mediator.publish 'playQueueItem:remove', @model

    drop: (event, index) ->
        @$el.trigger 'update-sort', [@model, index]