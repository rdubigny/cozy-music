TrackListItemView = require './tracklist_item'

module.exports = class PlayQueueItemView extends TrackListItemView

    template: require './templates/playqueue_item'

    events:
        'click #mini-play-button': 'onPlayClick'
        'click #delete-button': 'onDeleteClick'
        'click #delete-from-here-button': (e)->
            if e.ctrlKey or e.metaKey
                @onDeleteToHereClick(e)
            else
                @onDeleteFromHereClick(e)
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

    onPlayClick: (event)=>
        event.preventDefault()
        event.stopPropagation()
        @$el.trigger 'play-from-track', @model

    onDeleteClick: (event)=>
        event.preventDefault()
        event.stopPropagation()
         # remove the view without destroying the model
        @$el.trigger 'remove-item', @model

    onDeleteFromHereClick: (event)->
        @$el.trigger 'remove-from-track', @model

    onDeleteToHereClick: (event)->
        @$el.trigger 'remove-to-track', @model

    drop: (event, index) ->
        @$el.trigger 'update-sort', [@model, index]