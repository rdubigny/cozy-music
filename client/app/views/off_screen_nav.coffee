###
  Off screen nav view
###
BaseView = require '../../lib/base_view'

module.exports = class OffScreenNav extends BaseView

    className: 'off-screen-nav'
    tagName: 'div'
    template: require('./templates/off_screen_nav')

    events:
        'click .off-screen-nav-toggle': 'toggleNav'

    afterRender: ->
        #@nav = $("off-screen-nav")
        #@closeButton = $("off-screen-nav-close")
        #$('#off-screen-nav').on 'click', (e)=>
        #    @$el.toggleClass 'off-screen-nav-show'
        @updateDisplay()

    toggleNav: ->
        @$('.off-screen-nav-content').toggleClass 'off-screen-nav-show'
        @updateDisplay()

    updateDisplay: ->
        if @$('.off-screen-nav-content').hasClass 'off-screen-nav-show'
            @$('.off-screen-nav-toggle-arrow').addClass 'on'
        else
            @$('.off-screen-nav-toggle-arrow').removeClass 'on'