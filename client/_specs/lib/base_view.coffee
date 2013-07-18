
describe 'lib/base_view', ->

    BaseView = require 'lib/base_view'
    class testView extends BaseView
        template: -> '<div id="test"></div>'
        getRenderData: -> key: 'value'

    options = optkey: 'optvalue'

    spyTemplate = sinon.spy testView.prototype, 'template'
    spyRenderData = sinon.spy testView.prototype, 'getRenderData'

    it 'should not call anything on creation', ->
        @view = new testView(options)
        expect(spyTemplate.called).to.be.false
        expect(spyRenderData.called).to.be.false

    it 'should not throw on render', ->
        @view.render()

    it 'should have called getRenderData', ->
        expect(spyRenderData.calledOnce).to.be.true

    it 'should have called template with renderData and options', ->
        expect(spyTemplate.calledOnce).to.be.true
        arg = spyTemplate.firstCall.args[0]
        expect(arg).to.have.property('key', 'value')
        expect(arg).to.have.property('optkey', 'optvalue')

    it 'should contains the template', ->
        expect(@view.$el.find '#test').to.have.length 1

    # TODO check for memory leaks
