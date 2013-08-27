###
    added for this list :
        - sort
        - auto fill with blank tracks
###

TrackView = require './tracks_item'
TrackListView = require './tracklist'

module.exports = class TracksView extends TrackListView

    itemview: TrackView

    # Register listener
    events:
        'click th.field.title': (event)->
            @onClickTableHead event, 'title'
        'click th.field.artist': (event)->
            @onClickTableHead event, 'artist'
        'click th.field.album': (event)->
            @onClickTableHead event, 'album'

        'album:queue': 'queueAlbum'
        'album:pushNext': 'pushNextAlbum'

        # when a track is selected
        'click-track': 'onClickTrack'

    # minimum track-list length
    minTrackListLength: 40

    subscriptions:
        # when adding/removing new tracks
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
            # add stripes
            unless @$(".track:nth-child(2)").hasClass 'odd'
                @$(".track:first").addClass 'odd'

        'trackItem:remove': (e) ->
            # add blank track if necessary
            if @collection.length <= @minTrackListLength
                @appendBlanckTrack()
                $('tr.blank:odd').addClass 'odd'
                $('tr.blank:even').removeClass 'odd'

    initialize: ->
        super
        @selectedTrackView = null

        @views = {}

        # default value : sort by artist
        @toggleSort Cookies('defaultSortItem') || 'artist'

        # specify the current sorting mode
        @elementSort = null

        # always render after sorting (except for the first sort)
        # doesn't work
        @listenTo @collection, 'sort', @render
        # suppress that when views_collection is functional (with onReset)
        @listenTo @collection, 'sync', (e) ->
            console.log "vue tracklist : \"pense à me supprimer un de ces quatres\""
            if @collection.length is 0
                Backbone.Mediator.publish 'tracklist:isEmpty'

        # override to prevent shortcut to trigger when editing fields
        Mousetrap.stopCallback = (e, element, combo) ->
            # if the element has the class "mousetrap" then no need to stop
            if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1)
                # don't stop if keys are 'tab' or 'enter' or 'esc'
                if e.which is 9 or e.which is 13 or e.which is 27
                    return false

            # stop for input, select, and textarea
            return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true')

    afterRender: =>
        super
        # uncomment that when views_collection is functional
        #console.log "length : "+@collection.length
        #if @collection.length is 0
        #    Backbone.Mediator.publish('tracklist:isEmpty')
        @updateSortingDisplay()

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

    onClickTrack: (e, trackView)=>
        # unselect previous selected track if there is one
        if @selectedTrackView?
            @selectedTrackView.unSelect()
        # register selected track
        @selectedTrackView = trackView

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
        Cookies.set 'defaultSortItem', element

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
        compare = (t1, t2)->
            for i in [0..3]
                field1 = t1.get(elementArray[i])
                field2 = t2.get(elementArray[i])
                if (field1.match(/^[0-9]+$/))? and (field2.match(/^[0-9]+$/))?
                    field1 = parseInt(field1)
                    field2 = parseInt(field2)
                else if (field1.match(/^[0-9]+\/[0-9]+$/))? and (field2.match(/^[0-9]+\/[0-9]+$/))?
                    #if field1.match(/\/[0-9]+$/) is field2.match(/\/[0-9]+$/)
                    field1 = parseInt(field1.match(/^[0-9]+/))
                    field2 = parseInt(field2.match(/^[0-9]+/))
                else
                    # disable case sensitive search for non numeric value
                    field1 = field1.toLowerCase()
                    field2 = field2.toLowerCase()
                return -1 if field1 < field2
                return 1 if field1 > field2
            0

        if @isReverseOrder
            @collection.comparator = (t1, t2)=>
                compare t2, t1
        else
            @collection.comparator = (t1, t2)=>
                compare t1, t2

        # sort with this new comparator function
        @collection.sort()

    queueAlbum: (event, album)->
        albumsTracks = @collection.where
            album: album
        for track in albumsTracks
            if track.attributes.state is 'server'
                Backbone.Mediator.publish 'track:queue', track

    pushNextAlbum: (event, album)->
        albumsTracks = @collection.where
            album: album
        albumsTracks.reverse()
        for track in albumsTracks
            if track.attributes.state is 'server'
                Backbone.Mediator.publish 'track:pushNext', track
