TrackListItemView = require './tracklist_item'

module.exports = class PlayListItemView extends TrackListItemView

    events:
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

    onDeleteClick: (event)->
        event.preventDefault()
        event.stopPropagation()
         # remove the view without destroying the model
        @$el.trigger 'remove-item', @model

    drop: (event, index) ->
        @$el.trigger 'update-sort', [@model, index]