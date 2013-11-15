Track = require '../models/track'

module.exports = class PlayQueue extends Backbone.Collection

    atPlay: 0

    # Model that will be contained inside the collection.
    model: Track

    # This is where ajax requests the backend
    # there is no backend here because it's en temporary list
    #url: 'playqueue'

    # playLoop is : 'no-repeat', 'repeat-all' or 'repeat-one'
    playLoop: 'no-repeat'

    # used for cases where view have to be signaled after change is done
    viewHaveToBeSignaled = false

    setAtPlay: (value, signalView=true)=>
        @atPlay = value
        if signalView
            @trigger 'change:atPlay'
        else
            @viewHaveToBeSignaled = true

    # return current track pointed by atPlay if it exist
    getCurrentTrack: ->
        if 0 <= @atPlay < @length
            return @at(@atPlay)
        # else there is no track in the queue yet
        else
            return null

    # return next track, if there is no more track return null
    getNextTrack: ->
        if @playLoop is 'repeat-one'
            return @at(@atPlay)
        else if @atPlay < @length-1
            @setAtPlay @atPlay+1
            return @at(@atPlay)
        else if @playLoop is 'repeat-all' and @length > 0
            @setAtPlay 0
            return @at(@atPlay)
        else
            return null

    # return previous track, if this is the first track return null
    getPrevTrack: ->
        if @playLoop is 'repeat-one'
            return @at(@atPlay)
        else if @atPlay > 0
            @setAtPlay @atPlay-1
            return @at(@atPlay)
        else if @playLoop is 'repeat-all' and @length > 0
            @setAtPlay @length - 1
            return @at(@atPlay)
        else
            return null

    # add the track at the end of the collection
    queue: (track)->
        unless @get(track.id)
            @push track,
                sort: false
        # if the track is in the playlist already,
        # just move it to its new position
        else
            @moveItem track, @size()-1

    # add the track at the index atPlay+1
    pushNext: (track)->
        unless @get(track.id)
            if @length > 0
                @add track,
                    at : @atPlay+1
            else
                @add track
        # if the track is in the playlist already,
        # just move it to its new position
        else
            if @indexOf(track) < @atPlay
                @moveItem track, @atPlay
            else
                @moveItem track, @atPlay+1

    moveItem: (track, position)->
        # first : update atPlay value
        if @indexOf(track) == @atPlay
            @setAtPlay position
        else
            if @indexOf(track) < @atPlay
                @setAtPlay @atPlay-1
            if position <= @atPlay
                @setAtPlay @atPlay+1
        # then : move the track
        @remove track, false
        @add track,
            at: position

    # update atPlay value then call remove on track
    remove: (track, updateAtPlayValue = true)->
        if updateAtPlayValue
            if @indexOf(track) < @atPlay
                @setAtPlay @atPlay-1, false
            else if @indexOf(track) == @atPlay
                id = track.get 'id'
                Backbone.Mediator.publish 'track:delete', "sound-#{id}"
                if @indexOf(track) is @indexOf(@last()) and @length > 1
                    @setAtPlay @atPlay-1, false
        super track
        if @viewHaveToBeSignaled
            @trigger 'change:atPlay'
            @viewHaveToBeSignaled = false


    playFromTrack: (track)->
        index = @indexOf(track)
        @setAtPlay index
        Backbone.Mediator.publish 'track:play-from', track

    deleteFromIndexToEnd: (index)->
        @remove(@last()) while @indexOf(@last()) >= index

    deleteFromBeginingToIndex: (index)->
        count = if index < @length then index else @length
        for i in [0..count]
            @remove(@first())

    # randomize the tracks following the track at play
    randomize: ->
        if @atPlay < @length-1
            # this collection will content the queue end in shuffle order
            tmp = new Backbone.Collection()
            for i in [@atPlay+1..@length-1]
                tmp.push @models[i]
            tmp.reset tmp.shuffle()
            # replace the end of the queue by the shuffled one
            @remove(@last()) while @indexOf(@last()) > @atPlay
            for i in [0..tmp.length-1]
                @push tmp.models[i]

    # debug function
    show: ->
        console.log "atPlay : "+@atPlay
        console.log "PlayQueue content :"
        if @length >= 1
            for i in [0..@length-1]
                curM = @models[i]
                console.log @indexOf(curM)+") "+curM.attributes.title