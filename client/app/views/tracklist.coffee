TrackView = require './tracklist_item'
Track = require '../models/track'
ViewCollection = require '../lib/view_collection'

module.exports = class TrackListView extends ViewCollection

    className: 'tracks-display'
    tagName: 'div'
    template: require('./templates/tracklist')
    itemview: TrackView
    collectionEl: '#track-list'

    # minimum track-list length
    minTrackListLength: 20

    # Register listener
    events:
        'click th.field.title': (event)->
            @onClickTableHead event, 'title'
        'click th.field.artist': (event)->
            @onClickTableHead event, 'artist'
        'click th.field.album': (event)->
            @onClickTableHead event, 'album'

    subscriptions:
        # when a track is selected or unselected
        'track:click': 'onClickTrack'
        'track:unclick': 'onUnclickTrack'
        # when adding new tracks
        'uploader:addTracks': (e)->
            # remove display arrow
            @elementSort = null
            @isReverseOrder= false
            @updateSortingDisplay()
            # scroll on top of the list
            @$('.viewport').scrollTop "0"

        'uploader:addTrack': (e)->
            # remove blank track if necessary
            @$(".blank:last").remove()

        'trackItem:remove': (e) ->
            # add blank track if necessary
            if @collection.length <= @minTrackListLength
                @appendBlanckTrack()

    initialize: ->
        super
        @toggleSort 'artist' # default value : sort by artist

        # specify the current sorting mode
        @elementSort = null
        @isReverseOrder= false

        # always render after sorting (except for the first sort)
        # doesn't work
        @listenTo @collection, 'sort', @render
        # suppress that when views_collection is functional (with onReset)
        @listenTo @collection, 'sync', (e) ->
            console.log "vue tracklist : \"pense à me supprimer un de ces quatres\""
            if @collection.length is 0
                Backbone.Mediator.publish 'tracklist:isEmpty'

    afterRender: =>
        super
        # uncomment that when views_collection is functional
        #console.log "length : "+@collection.length
        #if @collection.length is 0
        #    Backbone.Mediator.publish('tracklist:isEmpty')

        @selectedTrackView = null
        @updateSortingDisplay()

        # adding scrollbar
        @$('.viewport').niceScroll(
            cursorcolor:"#ddd"
            cursorborder: ""
            cursorwidth:"10px"
            cursorborderradius: "0px"
        )

        # adding blank tracks if there is not enough tracks to display
        if @collection.length <= @minTrackListLength
            for i in [@collection.length..@minTrackListLength]
                @appendBlanckTrack()

        # adding table stripes
        $('.tracks-display tr:odd').addClass 'odd'

    appendBlanckTrack: =>
        blankTrack = $(document.createElement('tr'))
        blankTrack.addClass "track blank"
        blankTrack.html "<td colspan=\"6\"></td>"
        @$collectionEl.append blankTrack

    remove: ->
        super
        @$('.viewport').getNiceScroll().remove()

    # manage sortArrow display according to elementSort & isReverseOrder values
    updateSortingDisplay: =>
        # remove old arrow
        @$('.sortArrow').remove()

        # if elementSort is null, don't display sorting
        if @elementSort?
            # create a new arrow
            newArrow = $(document.createElement('div'))
            if @isReverseOrder
                newArrow.addClass 'sortArrow up'
            else
                newArrow.addClass 'sortArrow down'

            # append it in the document
            @$('th.field.'+@elementSort).append newArrow

    # event listeners for clicks on table header
    onClickTableHead: (event, element) =>
        event.preventDefault()
        event.stopPropagation()
        @toggleSort element


    toggleSort: (element)=>
        # sort by 'element' in alphabetical order
        # update variables for displaying
        if @elementSort is element
            @isReverseOrder = not @isReverseOrder
        else
            @isReverseOrder = false

        @elementSort = element

        if element is 'title'
            elementArray = ['title', 'artist', 'album', 'track']
        else if element is 'artist'
            elementArray = ['artist', 'album', 'track', 'title']
        else if element is 'album'
            elementArray = ['album', 'track', 'title', 'artist']
        else
            elementArray = [element, null, null, null]

        # override the comparator function
        if @isReverseOrder
            @collection.comparator = (t1, t2)->
                return -1 if t1.get(elementArray[0]) > t2.get(elementArray[0])
                return 1 if t1.get(elementArray[0]) < t2.get(elementArray[0])
                return -1 if t1.get(elementArray[1]) > t2.get(elementArray[1])
                return 1 if t1.get(elementArray[1]) < t2.get(elementArray[1])
                return -1 if t1.get(elementArray[2]) > t2.get(elementArray[2])
                return 1 if t1.get(elementArray[2]) < t2.get(elementArray[2])
                return -1 if t1.get(elementArray[3]) > t2.get(elementArray[3])
                return 1 if t1.get(elementArray[3]) < t2.get(elementArray[3])
                0
        else
            @collection.comparator = (t1, t2)->
                return -1 if t1.get(elementArray[0]) < t2.get(elementArray[0])
                return 1 if t1.get(elementArray[0]) > t2.get(elementArray[0])
                return -1 if t1.get(elementArray[1]) < t2.get(elementArray[1])
                return 1 if t1.get(elementArray[1]) > t2.get(elementArray[1])
                return -1 if t1.get(elementArray[2]) < t2.get(elementArray[2])
                return 1 if t1.get(elementArray[2]) > t2.get(elementArray[2])
                return -1 if t1.get(elementArray[3]) < t2.get(elementArray[3])
                return 1 if t1.get(elementArray[3]) > t2.get(elementArray[3])
                0

        # sort with this new comparator function
        @collection.sort()

    onClickTrack: (trackView)=>
        # unselect previous selected track if there is one
        unless @selectedTrackView is null
            @selectedTrackView.toggleSelect()
        # register selected track
        @selectedTrackView = trackView

    onUnclickTrack: =>
        # unregister selected track
        @selectedTrackView = null