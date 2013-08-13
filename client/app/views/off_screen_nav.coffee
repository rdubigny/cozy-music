###
  Off screen nav view
###
BaseView = require '../../lib/base_view'

module.exports = class OffScreenNav extends BaseView

    className: 'off-screen-nav'
    tagName: 'div'
    template: require('./templates/off_screen_nav')

    magicCounterSensibility : 6
    magicCounter : @magicCounterSensibility

    afterRender: =>
        #@$el.hover ->
        #    console.log 'ha!'
        #, ->
        #    console.log 'ho...'
        @$el.on 'click', @toggleNav
        @$el.on 'click', @onToggleOn
        @$el.on 'mousemove', @magicToggle

        @updateDisplay()

    magicToggle: (e)=>
        if e.pageX is 0
            @magicCounter -= 1
        else
            @magicCounter = @magicCounterSensibility
        if @magicCounter is 0
            @magicCounter = @magicCounterSensibility
            @onToggleOn()
            @toggleNav()

    onToggleOn: =>
        @$el.off 'click', @onToggleOn
        @$el.on 'click', @onToggleOff
        @$el.off 'mousemove', @magicToggle
        @$el.on 'mouseleave', @onToggleOff
        @$el.on 'mouseleave', @toggleNav

    onToggleOff: =>
        @$el.on 'click', @onToggleOn
        @$el.off 'click', @onToggleOff
        @$el.on 'mousemove', @magicToggle
        @$el.off 'mouseleave', @onToggleOff
        @$el.off 'mouseleave', @toggleNav

    toggleNav: =>
        @$('.off-screen-nav-content').toggleClass 'off-screen-nav-show'
        @updateDisplay()

    updateDisplay: ->
        if @$('.off-screen-nav-content').hasClass 'off-screen-nav-show'
            @$('.off-screen-nav-toggle-arrow').addClass 'on'
        else
            @$('.off-screen-nav-toggle-arrow').removeClass 'on'