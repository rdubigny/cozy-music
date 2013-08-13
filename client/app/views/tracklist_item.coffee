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
            @$('td.field.num').html @model.attributes.track

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
