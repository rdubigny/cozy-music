TrackListItemView = require './tracklist_item'

module.exports = class PlayQueueItemView extends TrackListItemView

    events:
        'click .button.delete': 'onDeleteClick'

    afterRender: ->
        super
        @$('#state').remove('.button')

    onDeleteClick: (event)=>
        event.preventDefault()
        event.stopPropagation()

        # signal player if this track is at play
        id = @model.attributes.id
        Backbone.Mediator.publish 'track:delete', "sound-#{id}"

        # signal trackList view
        Backbone.Mediator.publish 'playQueueItem:remove', @model


