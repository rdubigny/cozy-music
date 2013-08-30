Tracklist = require './tracklist'
BaseView = require 'lib/base_view'
TrackView = require './playlist_item'

module.exports = class PlayListView extends Tracklist

    template: require('./templates/playlist')
    itemview: TrackView

    events:
        'remove-item': (e, track)->
            @collection.remove track
        'click #playlist-play': 'onClickPlay'

    afterRender: =>
        super
        # adding table stripes
        $('.tracks-display tr:odd').addClass 'odd'

    onClickPlay: (event)->
        event.preventDefault()
        event.stopPropagation()
        @collection.each (track)->
            if track.attributes.state is 'server'
                Backbone.Mediator.publish 'track:pushNext', track