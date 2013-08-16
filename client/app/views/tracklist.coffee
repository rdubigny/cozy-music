Track = require '../models/track'
ViewCollection = require '../lib/view_collection'

module.exports = class TrackListView extends ViewCollection

    className: 'tracks-display'
    tagName: 'div'
    template: require('./templates/tracklist')
    collectionEl: '#track-list'

    subscriptions:
        # when a track is selected or unselected
        'track:click': 'onClickTrack'
        'track:unclick': 'onUnclickTrack'

    afterRender: =>
        super
        @selectedTrackView = null

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

    removeScrollBar: ->
        @$('.viewport').getNiceScroll().remove()

    remove: ->
        super
        @$('.viewport').getNiceScroll().remove()

    onClickTrack: (trackView)=>
        # unselect previous selected track if there is one
        unless @selectedTrackView is null
            @selectedTrackView.toggleSelect()
        # register selected track
        @selectedTrackView = trackView

    onUnclickTrack: =>
        # unregister selected track
        @selectedTrackView = null