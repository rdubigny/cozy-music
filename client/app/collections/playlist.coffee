Track = require '../models/track'

module.exports = class PlaylistTrackCollection extends Backbone.Collection

    # Model that will be contained inside the collection.
    model: Track

    getWeight: (playlists)=>
        for elem in playlists
            if elem.id is @playlistId
                return elem.weight
        return false

    add: (track, superOnly = false, options)=>
        return super(track, options) if superOnly
        if @size() > 0
            last = @last()
            lastWeight = @getWeight last.attributes.playlists
        else
            lastWeight = 0
        track.sync 'update', track,
            url: "#{@url}/#{track.id}/#{lastWeight}"
            error: (xhr)=>
                msg = JSON.parse xhr.responseText
                alert "fail to add track : #{msg.error}"
            success: (playlists)=>
                track.attributes.playlists = playlists

        # avoiding calling super if an error occured
        @listenToOnce track, 'sync', super

    remove: (track, superOnly = false)->
        return super(track) if superOnly
        track.sync 'delete', track,
            url: "#{@url}/#{track.id}"
            error: (xhr)->
                msg = JSON.parse xhr.responseText
                alert "fail to remove track : #{msg.error}"
        # avoiding calling super if an error occured
        @listenToOnce track, 'sync', super

    move: (newPosition, track)->
        console.log "move from #{@indexOf(track)} to #{newPosition}"
        newP = newPosition
        oldP = @indexOf(track)
        return if newP is oldP
        if newPosition is 0
            prevWeight = 0
        else
            prev = if oldP < newP then @at(newPosition) else @at(newPosition-1)
            prevWeight = @getWeight prev.attributes.playlists
        if newPosition >= @indexOf(@last())
            nextWeight = Math.pow 2,53
        else
            next = if oldP < newP then @at(newPosition+1) else @at(newPosition)
            nextWeight = @getWeight next.attributes.playlists
        i = 0
        @forEach (tmp)=>
            console.log "#{i}) #{@getWeight(tmp.attributes.playlists)}"
            i++
        console.log "I got a prevWeight (#{prevWeight}) and a nextWeight (#{nextWeight})"
        track.sync 'update', track,
            url: "#{@url}/prev/#{prevWeight}/next/#{nextWeight}/#{track.id}"
            error: (xhr)->
                msg = JSON.parse xhr.responseText
                alert "fail to move track : #{msg.error}"
            success: (playlists)=>
                track.attributes.playlists = playlists
                i = 0
                @forEach (tmp)=>
                    console.log "#{i}) #{@getWeight(tmp.attributes.playlists)}"
                    i++
        @remove track, true
        @add track, true,
            at: newPosition