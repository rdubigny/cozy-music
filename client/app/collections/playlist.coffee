Track = require '../models/track'

module.exports = class PlaylistTrackCollection extends Backbone.Collection

    # Model that will be contained inside the collection.
    model: Track

    add: (track)=>
        track.sync 'update', track,
            url: "#{@url}/#{track.id}"
            error: (xhr)->
                msg = JSON.parse xhr.responseText
                alert "fail to add track : #{msg.error}"
        # avoiding calling super if an error occured
        @listenToOnce track, 'sync', super

    remove: (track)->
        track.sync 'delete', track,
            url: "#{@url}/#{track.id}"
            error: (xhr)->
                msg = JSON.parse xhr.responseText
                alert "fail to remove track : #{msg.error}"
        # avoiding calling super if an error occured
        @listenToOnce track, 'sync', super

    ###
    appendToList: (model)->
        pl = model.attributes.playlists
        newPlaylists =  if pl? and pl isnt "" then pl else []
        unless @playlistId in newPlaylists
            newPlaylists.push @playlistId
            model.save
                playlists: newPlaylists
        else
            alert "Track is in the playlist already."

    remove: (model)->
        # if track is deleted from database
        # no need to remove it from playlist
        if model.attributes?
            @removePlaylistId model
        super model

    removePlaylistId: (model)->
        pl = model.attributes.playlists
        if pl? and pl isnt ""
            ind = pl.indexOf @playlistId
            if ind isnt -1
                pl.splice ind, 1
                model.save
                    playlists: pl

    beforeDestroy: ->
        console.log @
        for model in @models
            @removePlaylistId(model)
    ###