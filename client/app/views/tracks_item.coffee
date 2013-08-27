TrackListItemView = require './tracklist_item'
app = require 'application'

module.exports = class TracksItemView extends TrackListItemView

    template: require './templates/tracks_item'

    events:
        'click #delete-button': 'onDeleteClick'
        'click #play-track-button': (e)->
            if e.ctrlKey or e.metaKey
                @onPlayNextTrack(e)
            else
                @onQueueTrack(e)
        'click #add-to-button': (e)->
            e.preventDefault()
            e.stopPropagation()
            if app.selectedPlaylist?
                @onAddTo()
            else
                alert "No playlist selected. Please select a playlist in the navigation bar on the left"
        'dblclick [id$="button"]': (event)->
            # prevent triggering multiple events when dbl clicking on a button
            event.preventDefault()
            event.stopPropagation()
        'dblclick': (e)->
            e.preventDefault()
            e.stopPropagation()
            if @isEdited isnt ''
                @disableEdition()
                @isEdited = ''
            @onDblClick e

        'click #play-album-button': (e)->
            if e.ctrlKey or e.metaKey
                @onPlayNextAlbum(e)
            else
                @onQueueAlbum(e)

        'click .title': (e) -> @onClick e, 'title'
        'click .artist': (e) -> @onClick e, 'artist'
        'click .album': (e) -> @onClick e, 'album'
        'click': (e) -> @onClick e, ''

    isEdited = ''

    # Called after the constructor
    initialize: ->
        super
        # handle variable changes
        @listenTo @model, 'change:state', @onStateChange
        @listenTo @model, 'change:title', (event)=>
            @$('td.field.title input').val @model.attributes.title
        @listenTo @model, 'change:artist', (event)=>
            @$('td.field.artist input').val @model.attributes.artist
        @listenTo @model, 'change:album', (event)=>
            @$('td.field.album input').val @model.attributes.album
        @listenTo @model, 'change:track', (event)=>
            @$('td.field.num').html @model.attributes.track

    onClick: (event, element)=>
        event.preventDefault()
        event.stopPropagation()
        if @model.attributes.state is 'server'
            # if the track is already selected
            if @$el.hasClass 'selected'
                # is another element is selected
                if @isEdited isnt element
                    # disable edition on the previously edited element
                    if @isEdited isnt ''
                        @disableEdition()
                    # then enable edition on this track
                    @isEdited = element
                    @enableEdition()
            else
                # select track
                @$el.addClass 'selected'
                # signal to unselect previous selection and register the new one
                @$el.trigger 'click-track', @
                # enable F2 key
                Mousetrap.bind 'f2', ()=>
                    if isEdited is ''
                        @isEdited = 'title'
                        @enableEdition()

    unSelect: =>
        @$el.removeClass 'selected'
        if @isEdited isnt ''
            selector = ".#{@isEdited} input"
            @disableEdition()
            @isEdited = ''
        Mousetrap.unbind 'f2'

    enableEdition: ->
        if @isEdited isnt ''
            selector = ".#{@isEdited} input"
            unless @$(selector).hasClass 'activated'
                @$(selector).addClass 'activated'
                @$(selector).removeAttr 'readonly'
                @$(selector).focus()
                @$(selector).select()
                @tmpValue = @$(selector).val()

                Mousetrap.bind 'enter', ()=>
                    @disableEdition()
                    @isEdited = ''

                Mousetrap.bind 'esc', ()=>
                    @$(selector).val @tmpValue
                    @disableEdition(false)
                    @isEdited = ''

                Mousetrap.bind 'tab', (e)=>
                    e.preventDefault()
                    @disableEdition()
                    oldEdit = @isEdited
                    @isEdited = switch
                        when oldEdit is 'title' then 'artist'
                        when oldEdit is 'artist' then 'album'
                        when oldEdit is 'album' then 'title'
                    @enableEdition()

    disableEdition: (save=true)=>
        if @isEdited isnt ''
            selector = ".#{@isEdited} input"
            if @$(selector).hasClass 'activated'
                if save  and @$(selector).val() isnt @tmpValue
                    @saveNewValue()
                @$(selector).blur()
                @$(selector).attr 'readonly', 'readonly'
                @$(selector).removeClass 'activated'
                @tmpValue = null
                Mousetrap.unbind 'enter'
                Mousetrap.unbind 'esc'
                Mousetrap.unbind 'tab'

    saveNewValue: ->
        selector = ".#{@isEdited} input"
        val = @$(selector).val()
        @tmpValue = val
        switch
            when @isEdited is 'title' then @model.attributes.title = val
            when @isEdited is 'artist' then @model.attributes.artist = val
            when @isEdited is 'album' then @model.attributes.album = val
        @saving = true
        @model.save
            success: =>
                @saving = false
            error: =>
                alert "An error occured, modifications were not saved."
                @saving = false

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

