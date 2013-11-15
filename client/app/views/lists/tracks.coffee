###
    Inherited from tracklist

    Features :
    - sort by title, artist or album
    - navigate amongst files with arrows
    - tracks are highlighted in playlist edition mode
    - queue albums and titles
    - add to playlist
    - delete tracks
    - metadata edition
    - auto fill with blank tracks
###

app = require 'application'
TrackView = require 'views/lists/tracks_item'
TrackListView = require 'views/lists/tracklist'

module.exports = class TracksView extends TrackListView

    template: require('views/templates/tracks')
    itemview: TrackView

    # Register listener
    events:
        'click th.field.title': (event)->
            @onClickTableHead event, 'title'
        'click th.field.artist': (event)->
            @onClickTableHead event, 'artist'
        'click th.field.album': (event)->
            @onClickTableHead event, 'album'
        'click th.field.plays': (event)->
            @onClickTableHead event, 'plays'

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

        'offScreenNav:newPlaylistSelected': 'highlightTracks'

    initialize: ->
        super
        @selectedTrackView = null

        # default value : sort by artist
        @toggleSort Cookies('defaultSortItem') || 'artist'

        # specify the current sorting mode
        @elementSort = null

        # always render after sorting (except for the first sort)
        # doesn't work
        @listenTo @collection, 'sort', @render
        # suppress that when views_collection is functional (with onReset)
        @listenTo @collection, 'sync', (e) ->
            #console.log "vue tracks : \"pense à me supprimer un de ces quatres\""
            if @collection.length is 0
                Backbone.Mediator.publish 'tracklist:isEmpty'

        # override to prevent shortcut to trigger when editing fields
        Mousetrap.stopCallback = (e, element, combo) ->
            # if the element has the class "mousetrap" then no need to stop
            if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1)
                # don't stop if keys are 'tab' or 'enter' or 'esc' or 'f2'
                if e.which in [9, 13, 27, 113]
                    return false

            # stop for input, select, and textarea that aren't in readOnly mode
            return element.readOnly is false && (element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true'))

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

        # highlight tracks if playlist edition mode is enabled
        if app.selectedPlaylist?
            @highlightTracks app.selectedPlaylist

        # enable arrow up and down to navigate through tracks
        Mousetrap.bind 'up', ()=>
            if @selectedTrackView?
                index = @collection.indexOf @selectedTrackView.model
                # if this is not the first track we can go up
                if index > 0
                    # get the previous view
                    prevIndex = index - 1
                    prevCid = @collection.at(prevIndex).cid
                    prevView = @views[prevCid]

                    # manually scroll if needed
                    @scrollCheck(prevView)

                    # update
                    prevView.el.click()
            else
                cid = @collection.last().cid
                view = @views[cid]
                # manually scroll if needed
                @scrollCheck(view)
                # update
                view.el.click()

        Mousetrap.bind 'down', ()=>
            if @selectedTrackView?
                index = @collection.indexOf @selectedTrackView.model
                # if this is not the last track we can go down
                if index < @collection.length-1
                    # get the next view
                    nextIndex = index + 1
                    nextCid = @collection.at(nextIndex).cid
                    nextView = @views[nextCid]

                    # manually scroll if needed
                    @scrollCheck(nextView)

                    # update
                    nextView.el.click()
            else
                cid = @collection.first().cid
                view = @views[cid]
                # manually scroll if needed
                @scrollCheck(view)
                # update
                view.el.click()

    # manually scroll if the view is out of the viewport
    scrollCheck: (view)=>
        itemEl = view.$el
        vp = @$('.viewport')

        currScroll = vp.scrollTop()
        h = itemEl.height()
        vph = vp.height()
        top = itemEl.position().top
        bot = top + h

        #scroll up
        if bot > vph
            diff = bot - vph
            vp.scrollTop currScroll + diff

        # scroll down
        if top < 0
            vp.scrollTop currScroll + top

    beforeDetach: =>
        # remove selection
        # -> disable navigation through tracks with up and down
        if @selectedTrackView?
            @selectedTrackView.unSelect()
            @selectedTrackView = null
        Mousetrap.unbind 'up'
        Mousetrap.unbind 'down'
        Mousetrap.unbind 'enter'
        super
        false

    appendBlanckTrack: =>
        blankTrack = $(document.createElement('tr'))
        blankTrack.addClass "track blank"
        blankTrack.html "<td colspan=\"7\"></td>"
        @$collectionEl.append blankTrack

    highlightTracks: (playlist) ->
            # add highlighting during playlist edition
            @$('tr.in-playlist').removeClass 'in-playlist'
            if playlist?
                for track in playlist.tracks.models
                    track2 = @collection.get track.id
                    if track2?.cid? # track2 my be deleted here
                        @views[track2.cid].$el.addClass 'in-playlist'

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

        # if elementSort is null, don't display sort arrows
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
        else if element is 'plays'
            elementArray = ['plays', 'title', 'artist', 'album']
        else
            elementArray = [element, null, null, null]

        # override the comparator function
        compare = (t1, t2)->
            for i in [0..3]
                field1 = t1.get(elementArray[i]).toString()
                field2 = t2.get(elementArray[i]).toString()
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
        albumsTracksF = albumsTracks.filter (track) ->
            track.attributes.state is 'server'
        Backbone.Mediator.publish 'tracks:queue', albumsTracksF

    pushNextAlbum: (event, album)->
        albumsTracks = @collection.where
            album: album
        albumsTracksF = albumsTracks.filter (track) ->
            track.attributes.state is 'server'
        Backbone.Mediator.publish 'tracks:pushNext', albumsTracksF