BaseView = require '../lib/base_view'
PlaylistTrackCollection = require '../collections/playlist'

module.exports = class PlaylistNavView extends BaseView

    # This time the html component does not exist in the dom.
    # So, we don't refer to a DOM element, we just give
    # class and tag names to let backbone build the component.
    className: 'playlist'
    tagName: 'div'

    # The template render the bookmark with data given by the model
    template: require './templates/playlist_nav'

    events:
        'click .select-playlist-button': 'onSelectClick'
        'click .delete-playlist-button': 'onDeleteClick'

    initialize: ->
        super
        # handle variable changes
        @listenTo @model, 'change:id', @onIdChange

    onIdChange: ->
        @$('a').attr 'href', "#playlist/#{@model.id}"

    onSelectClick: (event) =>
        event.preventDefault()
        event.stopPropagation()
        unless @$('li').hasClass('selected')
            @$('li').addClass('selected')
            @$el.trigger 'playlist-selected', @model

    onDeleteClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        @model.destroy
            error: =>
                alert "Server error occured, track was not deleted."