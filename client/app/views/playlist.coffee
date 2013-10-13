Tracklist = require './tracklist'
PlayQueueView = require './playqueue'
BaseView = require 'lib/base_view'
TrackView = require './playlist_item'

module.exports = class PlayListView extends PlayQueueView

    template: require('./templates/playlist')
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