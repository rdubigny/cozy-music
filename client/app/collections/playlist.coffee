Track = require '../models/track'

module.exports = class PlaylistTrackCollection extends Backbone.Collection

    # Model that will be contained inside the collection.
    model: Track

    add: (model)->
        console.log "adding a model"
        console.log model
        super
        model.set 'urlRoot', @url

    remove: (model)->
        console.log "removing a model"
        super

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