
describe 'lib/view_collection', ->

    BaseView = require 'lib/base_view'
    ViewCollection = require 'lib/view_collection'

    class myModel extends Backbone.Model

    class myCollection extends Backbone.Collection
        model: myModel

    class myView extends BaseView
        className: 'item'
        template: -> 'item content'
        getRenderData: -> @model.attributes

    class myCollectionView extends ViewCollection
        itemView: myView
        template: -> '<div id="test"></div>'
        itemViewOptions: -> optkey: 'optvalue'

    options = optkey: 'optvalue'

    spyRender   = sinon.spy myCollectionView.prototype, 'render'
    spyTemplate = sinon.spy myCollectionView.prototype, 'template'

    spyItemRender   = sinon.spy myView.prototype, 'render'
    spyItemRemove   = sinon.spy myView.prototype, 'remove'
    spyItemTemplate = sinon.spy myView.prototype, 'template'

    it 'should not call anything on creation', ->
        @collection = new myCollection()
        @view = new myCollectionView(collection: @collection)
        expect(spyTemplate.called).to.be.false
        expect(spyRender.called).to.be.false

    it 'should render a subview when I add a model to the collection', ->
        @model = new myModel attribute1:'value1'
        @collection.add @model
        expect(spyItemRender.calledOnce).to.be.true
        expect(spyItemTemplate.calledOnce).to.be.true
        arg = spyItemTemplate.firstCall.args[0]
        expect(arg).to.have.property('attribute1', 'value1')
        expect(arg).to.have.property('optkey', 'optvalue')
        expect(@view.$el.find '.item').to.have.length 1

    it 'should not touch subviews on render', ->
        @view.render() for i in [1..100]
        expect(spyItemRender.calledOnce).to.be.true
        expect(spyItemTemplate.calledOnce).to.be.true
        expect(@view.$el.find '#test').to.have.length 1

    it 'should remove the subview when I remove the model', ->
        @collection.remove @model
        expect(@view.$el.find '.item').to.have.length 0

    it 'should not keep a reference to the view', ->
        expect(_.size(@view.views)).to.equal 0
        expect(spyItemRemove.calledOnce).to.be.true



