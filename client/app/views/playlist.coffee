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

    #afterRender: =>
    #    super
    #    # adding table stripes
    #    $('.tracks-display tr:odd').addClass 'odd'

    onClickPlay: (event)->
        event.preventDefault()
        event.stopPropagation()
        @collection.each (track)->
            if track.attributes.state is 'server'
                Backbone.Mediator.publish 'track:pushNext', track

    updateSort: (event, track, position) ->
        # call the tracks#move route here