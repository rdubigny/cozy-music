TrackListItemView = require './tracklist_item'
app = require 'application'

module.exports = class TrackListItemView extends TrackListItemView

    events:
        'click #delete-button': 'onDeleteClick'
        'click #play-track-button': (e)->
            if e.ctrlKey or e.metaKey
                @onPlayNextTrack(e)
            else
                @onQueueTrack(e)
        'click #add-to-button': (e)->
            event.preventDefault()
            event.stopPropagation()
            if app.selectedPlaylist?
                @onAddTo()
            else
                alert "No playlist selected. Please select a playlist in the navigation bar on the left"
        'dblclick [id$="button"]': (event)->
            # prevent triggering multiple events when dbl clicking on a button
            event.preventDefault()
            event.stopPropagation()
        'dblclick': 'onDblClick'

        'click #play-album-button': (e)->
            if e.ctrlKey or e.metaKey
                @onPlayNextAlbum(e)
            else
                @onQueueAlbum(e)

    afterRender: ->
        super
        # in case the view is rendered during the upload (ex: because of a sort)
        state = @model.attributes.state
        if state is 'client'
            @initUpload()
        else if state is 'uploadStart'
            @initUpload()
            @startUpload()

    onDeleteClick: (event)=>
        event.preventDefault()
        event.stopPropagation()

        state = @model.attributes.state

        if state is 'uploadStart'
            # we don't know the file id on the server before the upload is ended
            # it simplier to just prohibit the cancelling at this moment
            alert "Wait for upload to finish to delete this track"
            return

        if state is 'client'
            # This will stop the upload process and delete the model
            @model.set
                state: 'canceled'

        # stop playing this track if at play
        #id = @model.attributes.id
        #Backbone.Mediator.publish 'track:delete', "sound-#{id}"
        # destroy the model
        @model.destroy
            error: =>
                alert "Server error occured, track was not deleted."
        # signal trackList view
        Backbone.Mediator.publish 'trackItem:remove'

    onDblClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        # if the file is not backed up yet, disable the play launch
        if @model.attributes.state is 'server'
            Backbone.Mediator.publish 'track:playImmediate', @model


    onQueueTrack: (event)->
        event.preventDefault()
        event.stopPropagation()
        # if the file is not backed up yet, disable the play launch
        if @model.attributes.state is 'server'
            Backbone.Mediator.publish 'track:queue', @model

    onPlayNextTrack: (event)->
        event.preventDefault()
        event.stopPropagation()
        # if the file is not backed up yet, disable the play launch
        if @model.attributes.state is 'server'
            Backbone.Mediator.publish 'track:pushNext', @model

    onQueueAlbum: (event)->
        event.preventDefault()
        event.stopPropagation()
        album = @model.attributes.album
        if album? and album isnt ''
            @$el.trigger 'album:queue', album
        else
            alert "can't play null album"

    onPlayNextAlbum: (event)->
        event.preventDefault()
        event.stopPropagation()
        album = @model.attributes.album
        if album? and album isnt ''
            @$el.trigger 'album:pushNext', album
        else
            alert "can't play null album"

    onAddTo: ->
        alert "Not implemented yet"

    onUploadProgressChange: (e)=>
        # make sure we can compute the length
        if e.lengthComputable
            #calculate the percentage loaded
            pct = Math.floor (e.loaded / e.total) * 100

            # here is a css trick for restarting css animation :
            # prepend the clone & then remove the original element
            el = @$ '.uploadProgress'
            # make sure the element have been initialized
            if el?
                el.before( el.clone(true) ).remove()

                # update percentage value display
                @$('.uploadProgress').html "#{pct}%"

        # this usually happens when Content-Length isn't set
        else
            console.warn 'Content Length not reported!'

    onStateChange: ->
        if @model.attributes.state is 'client'
            @initUpload()
        else if @model.attributes.state is 'uploadStart'
            @startUpload()
        else if @model.attributes.state is 'uploadEnd'
            @endUpload()

    initUpload: ->
        @saveAddBtn = @$('#add-to-button').detach()
        @savePlayTrackBtn = @$('#play-track-button').detach()
        uploadProgress = $(document.createElement('div'))
        uploadProgress.addClass('uploadProgress')
        uploadProgress.html 'INIT'
        @$('#state').append uploadProgress

    startUpload: ->
        @$('.uploadProgress').html '0%'
        @listenTo @model, 'progress', @onUploadProgressChange

    endUpload: ->
        @stopListening @model, 'progress'
        @$('.uploadProgress').html 'DONE'
        @$('.uploadProgress').delay(1000).fadeOut 1000, @returnToNormal

    returnToNormal: =>
        @$('.uploadProgress').remove()
        @$('#state').append @saveAddBtn
        @$('#state').append @savePlayTrackBtn
        @model.attributes.state = 'server'

