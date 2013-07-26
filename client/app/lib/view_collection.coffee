BaseView = require 'lib/base_view'

# View that display a collection of subitems
# used to DRY views
# Usage : new ViewCollection(collection:collection)
# Automatically populate itself by creating a itemView for each item
# in its collection

# can use a template that will be displayed alongside the itemViews

# itemView       : the Backbone.View to be used for items
# itemViewOptions : the options that will be passed to itemViews
# collectionEl : the DOM element's selector where the itemViews will
#                be displayed. Automatically falls back to el if null

module.exports = class ViewCollection extends BaseView

    itemview: null

    views: {}

    template: -> ''

    collectionEl: null

    # add 'empty' class to view when there is no sub-view
    # Warning : onChange is not an actual handler for the change event
    onChange: ->
        @$el.toggleClass 'empty', _.size(@views) is 0

    # can be overridden if we want to place the sub-views somewhere else
    # there is th add and th unshift functions for that.
    # The two fonction throw the same add event.
    appendView: (view) ->
        @$collectionEl.append view.el

    # bind listeners to the collection
    initialize: ->
        super
        # To handle the sub views.
        # already initialized by the constructor
        #@views = {}
        @listenTo @collection, "reset",   @onReset
        # commented because it disable the unshift backbone function
        #@listenTo @collection, "add",     @addItem
        @listenTo @collection, "remove",  @removeItem

        # fill free to override for a more accurate computing
        # binding add event to render is dirty dirty
        # because there is no need to render the whole collection just when
        # adding an only item. But here it's the quick solution I found
        # to enable unshift
        @listenTo @collection, 'add sort', @render

        if not @collectionEl?
            collectionEl = el

    # if we have views before a render call, we detach them
    beforeRender: ->
        view.$el.detach() for id, view of @views
        super

    # after render, we reattach the views
    afterRender: ->
        super
        @$collectionEl = $(@collectionEl)
        @appendView view.$el for id, view of @views
        @onReset @collection
        @onChange # no needs of argument "@appendView" here

    # destroy all sub views before remove
    remove: ->
        @onReset []
        super

    # event listener for reset
    onReset: (newcollection) ->
        view.remove() for id, view of @views
        newcollection.forEach @addItem

    # event listeners for add
    addItem: (model) =>
        options = _.extend {}, {model: model}
        view = new @itemview(options)
        @views[model.cid] = view.render()
        @appendView view
        @onChange

    # event listeners for remove
    removeItem: (model) =>
        @views[model.cid].remove()
        delete @views[model.cid]
        @onChange