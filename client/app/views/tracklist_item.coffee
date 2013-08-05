BaseView = require '../lib/base_view'

module.exports = class TrackListItemView extends BaseView

    # This time the html component does not exist in the dom.
    # So, we don't refer to a DOM element, we just give
    # class and tag names to let backbone build the component.
    className: 'track'
    tagName: 'tr'

    # The template render the bookmark with data given by the model
    template: require './templates/tracklist_item'

    events:
        'click .button.delete': 'onDeleteClicked'
        'click .button.puttoplay': 'onPlayClick'
        'dblclick': 'onPlayClick'
        'click': 'onClick'

    # Called after the constructor
    initialize: ->
        super
        # handle variable changes
        @listenTo @model, 'change:state', @onStateChange
        @listenTo @model, 'change:title', (event)=>
            @$('td.field.title').html @model.attributes.title
        @listenTo @model, 'change:artist', (event)=>
            @$('td.field.artist').html @model.attributes.artist
        @listenTo @model, 'change:album', (event)=>
            @$('td.field.album').html @model.attributes.album
        @listenTo @model, 'change:track', (event)=>
            @$('td.field.track').html @model.attributes.track

    afterRender: ->
        # in case the view is rendered during the upload (ex: because of a sort)
        state = @model.attributes.state
        if state is 'client'
            @initUpload()
        else if state is 'uploadStart'
            @initUpload()
            @startUpload()

    onDeleteClicked: (event)=>
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
        Backbone.Mediator.publish 'track:stop', "sound-#{id}"
        # destroy the model
        @model.destroy
            error: =>
                alert "Server error occured, track was not deleted."

    playTrack: ->
        fileName = @model.attributes.slug
        id = @model.attributes.id
        dataLocation = "tracks/#{id}/attach/#{fileName}"
        # signal the player to play this track
        Backbone.Mediator.publish 'track:play', "sound-#{id}", dataLocation

    onPlayClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        # if the file is not backed up yet, disable the play launch
        if @model.attributes.state is 'server'
            @playTrack()

    toggleSelect: ->
        if @$el.hasClass 'selected'
            # signal to unregister previous selection
            Backbone.Mediator.publish 'track:unclick', @
        else
            # signal to unselect previous selection and register the new one
            Backbone.Mediator.publish 'track:click', @
        @$el.toggleClass 'selected'

    onClick: (event)=>
        event.preventDefault()
        event.stopPropagation()
        @toggleSelect()

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
        @listenTo @model, "progress", @onUploadProgressChange

    endUpload: ->
        @stopListening @model, "progress"
        @$('.uploadProgress').html 'DONE'
        @$('.uploadProgress').delay(1000).fadeOut 1000, @returnToNormal

    returnToNormal: =>
        @$('.uploadProgress').remove()
        @$('#state').append @saveAddBtn
        @$('#state').append @savePlayBtn
        @model.attributes.state = 'server'
