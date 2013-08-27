BaseView = require 'lib/base_view'
PlayQueueView = require './tracklist'

module.exports = class PlayListView extends BaseView

    afterRender: ->
        super
        @playlist = new PlayQueueView
            collection: @model.tracks

        @playlist.render()
