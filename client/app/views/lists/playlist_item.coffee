TrackListItemView = require 'views/lists/tracklist_item'

module.exports = class PlayListItemView extends TrackListItemView

    template: require 'views/templates/playlist_item'

    events:
        'click #play-track-button': (e)->
            if e.ctrlKey or e.metaKey
                @onPlayNextTrack(e)
            else
                @onQueueTrack(e)
        'click #delete-button': 'onDeleteClick'
        'drop' : 'drop'

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
            @$('td.field.num').html @model.attributes.track

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

    onDeleteClick: (event)->
        event.preventDefault()
        event.stopPropagation()
         # remove the view without destroying the model
        @$el.trigger 'remove-item', @model

    drop: (event, index) ->
        @$el.trigger 'update-sort', [@model, index]