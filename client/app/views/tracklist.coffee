Track = require '../models/track'
ViewCollection = require '../lib/view_collection'
TrackView = require './tracklist_item'

module.exports = class TrackListView extends ViewCollection

    className: 'tracks-display'
    tagName: 'div'
    template: require('./templates/tracklist')
    collectionEl: '#track-list'
    itemview: TrackView

    initialize: ->
        super
        @views = {}

    afterRender: =>
        super

        # adding scrollbar
        @$('.viewport').niceScroll(
            cursorcolor:"#444"
            cursorborder: "" #1px solid #555
            cursorwidth:"15px"
            cursorborderradius: "0px"
            horizrailenabled: false
            cursoropacitymin: "0.3"
            hidecursordelay: "700"
            spacebarenabled: false
            enablekeyboard: false
        )

    beforeDetach: ->
        @$('.viewport').getNiceScroll().remove()

    remove: ->
        @$('.viewport').getNiceScroll().remove()
        super