###
    Inherited from playqueue (for the drag and drop feature)

    Features :
    - queue the entire list
    - list backed up on server side
###

Tracklist = require 'views/lists/tracklist'
PlayQueueView = require 'views/lists/playqueue'
BaseView = require 'lib/base_view'
TrackView = require 'views/lists/playlist_item'

module.exports = class PlayListView extends PlayQueueView

    template: require('views/templates/playlist')
    itemview: TrackView

    events:
        'update-sort': 'updateSort'
        'click #playlist-play': 'onClickPlay'
        'remove-item': (e, track)->
            @collection.remove track

    onClickPlay: (event)->
        event.preventDefault()
        event.stopPropagation()
        @collection.forEach (track)=>
            if track.attributes.state is 'server'
                Backbone.Mediator.publish 'track:queue', track

    updateSort: (event, track, newPosition) ->
        @collection.move newPosition, track