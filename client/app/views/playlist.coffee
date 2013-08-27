BaseView = require 'lib/base_view'
PlayQueueView = require './tracklist'

module.exports = class PlayListView extends BaseView

    initialize: ->
        super
        console.log @model
        @playlist = new PlayQueueView
            collection: @model.tracks

    afterRender: ->
        super
        @playlist.render()
