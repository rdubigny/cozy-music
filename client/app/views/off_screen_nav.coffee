###
  Off screen nav view
###
app = require '../application'
BaseView = require '../../lib/base_view'

module.exports = class OffScreenNav extends BaseView

    className: 'off-screen-nav'
    tagName: 'div'
    template: require('./templates/off_screen_nav')

    magicCounterSensibility : 6
    magicCounter : @magicCounterSensibility

    subscriptions:
        # keyboard events
        'keyboard:keypress' : (e)->
            switch e.keyCode
                when 118 then @onVKey() # "V" key

    afterRender: =>
        @$el.on 'click', @onToggleOn
        @$el.on 'mousemove', @magicToggle
        @notOnHome = $(location).attr('href').match(/playqueue$/)?

    onVKey: =>
        # toggle between the 2 views
        if @notOnHome
            app.router.navigate '#', true
        else
            app.router.navigate '#playqueue', true
        @notOnHome = !@notOnHome

    magicToggle: (e)=>
        if e.pageX is 0
            @magicCounter -= 1
        else
            @magicCounter = @magicCounterSensibility
        if @magicCounter is 0
            @magicCounter = @magicCounterSensibility
            @onToggleOn()

    onToggleOn: =>
        @$el.off 'click', @onToggleOn
        @$el.on 'click', @onToggleOff
        @$el.off 'mousemove', @magicToggle
        @$el.on 'mouseleave', @onToggleOff
        @toggleNav()

    onToggleOff: =>
        @$el.off 'click', @onToggleOff
        @$el.on 'click', @onToggleOn
        @$el.off 'mouseleave', @onToggleOff
        @$el.on 'mousemove', @magicToggle
        @toggleNav()

    toggleNav: =>
        @$('.off-screen-nav-content').toggleClass 'off-screen-nav-show'
        @updateDisplay()

    updateDisplay: ->
        if @$('.off-screen-nav-content').hasClass 'off-screen-nav-show'
            @$('.off-screen-nav-toggle-arrow').addClass 'on'
        else
            @$('.off-screen-nav-toggle-arrow').removeClass 'on'