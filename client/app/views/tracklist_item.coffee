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
        'click .button.puttoplay': 'onPlayClicked'
        'dblclick ': 'onDoubleClick'
        'click': 'onClick'

    initialize: ->
        super
        @listenTo @model, "change", @render

    afterRender: ->
        @initUpload() unless @model.attributes.onServer

    onDeleteClicked: (event)->
        event.preventDefault()
        event.stopPropagation()
        @$('td.field.title').html "deleting..."
        @model.destroy
            error: ->
                alert "Server error occured, track was not deleted."
                @$('td.field.title').html "error while deleting"

    playTrack: ->
        fileName = @model.attributes.slug
        id = @model.attributes.id
        dataLocation = "tracks/#{id}/attach/#{fileName}"
        # signal to player to play this track
        Backbone.Mediator.publish('track:play', "sound-#{id}", dataLocation)

    onPlayClicked: (event)->
        event.preventDefault()
        event.stopPropagation()
        @playTrack()


    onDoubleClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        @playTrack()

    toggleSelect: ->
        if @$el.hasClass 'selected'
            # signal to unregister previous selection
            Backbone.Mediator.publish('track:unclick', @)
        else
            # signal to unselect previous selection and register the new one
            Backbone.Mediator.publish('track:click', @)
        @$el.toggleClass 'selected'

    onClick: (event)=>
        event.preventDefault()
        event.stopPropagation()
        @toggleSelect()

    onProgressChange: (e)=>
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

    initUpload: ->
        @saveAddBtn = @$('.button.addto').detach()
        @savePlayBtn = @$('.button.puttoplay').detach()
        uploadProgress = $(document.createElement('div'))
        uploadProgress.addClass('uploadProgress')
        uploadProgress.html 'INIT'
        @$('#state').append uploadProgress

    startUpload: ->
        console.log 'uploading...'
        @$('.uploadProgress').html '0%'
        @listenTo @model, "progress", @onProgressChange

    endUpload: ->
        console.log 'DONE'
        @stopListening @model, "progress"
        @model.attributes.onServer = true
        @$('.uploadProgress').html 'DONE'
        @$('.uploadProgress').delay(2000).fadeOut 2000, @returnToNormal

    returnToNormal: =>
        @$('.uploadProgress').remove()
        @$('#state').append @saveAddBtn
        @$('#state').append @savePlayBtn
