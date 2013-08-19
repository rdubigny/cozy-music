BaseView = require '../lib/base_view'

module.exports = class PlaylistNavView extends BaseView

    # This time the html component does not exist in the dom.
    # So, we don't refer to a DOM element, we just give
    # class and tag names to let backbone build the component.
    className: 'playlist'
    tagName: 'div'

    # The template render the bookmark with data given by the model
    template: require './templates/playlist_nav'

    events:
        'click .delete-playlist-button': 'onDeleteClick'

    onDeleteClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        @model.destroy
            error: =>
                alert "Server error occured, track was not deleted."