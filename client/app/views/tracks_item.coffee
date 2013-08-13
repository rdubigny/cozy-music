TrackListItemView = require './tracklist_item'

module.exports = class TrackListItemView extends TrackListItemView

    events:
        'click .button.delete': 'onDeleteClick'
        'click .button.puttoplay': (e)->
            if e.ctrlKey
                @onPlayDblClick(e)
            else
                @onPlayClick(e)
        'dblclick .button.puttoplay': (event)->
            event.preventDefault()
            event.stopPropagation()
        'dblclick': 'onDblClick'

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
        id = @model.attributes.id
        Backbone.Mediator.publish 'track:delete', "sound-#{id}"
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


    onPlayClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        # if the file is not backed up yet, disable the play launch
        if @model.attributes.state is 'server'
            Backbone.Mediator.publish 'track:queue', @model

    onPlayDblClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        # if the file is not backed up yet, disable the play launch
        if @model.attributes.state is 'server'
            Backbone.Mediator.publish 'track:pushNext', @model

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
        @saveAddBtn = @$('.button.addto').detach()
        @savePlayBtn = @$('.button.puttoplay').detach()
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
        @$('#state').append @savePlayBtn
        @model.attributes.state = 'server'

