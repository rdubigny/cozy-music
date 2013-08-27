BaseView = require '../../lib/base_view'

module.exports = class VolumeManager extends BaseView

    className: 'volume'
    tagName: 'div'
    template: require('../templates/player/volumeManager')

    events:
        'mousedown .slider': 'onMouseDownSlider'
        'click #volume-switch-button': 'onClickToggleMute'

    initialize: (options)->
        super
        @volumeValue = options.initVol
        @isMuted = options.initMute

        # bind keyboard events
        Mousetrap.bind 'm', @toggleMute
        Mousetrap.bind '+', @volUp
        Mousetrap.bind '-', @volDown

    afterRender: ->
        super
        @slidableZone = $(document) # the zone where the user can slide
        @slider = @$('.slider')
        @sliderContainer = @$('.slider-container')
        @sliderInner = @$('.slider-inner')
        if @isMuted
            @sliderInner.width "0%"
            toggledClasses = 'icon-volume-up icon-volume-off activated'
            @$('#volume-switch-button i').toggleClass toggledClasses
        else
            @sliderInner.width "#{@volumeValue}%"

    onMouseDownSlider: (event) ->
        event.preventDefault()
        @retrieveVolumeValue(event)
        @slidableZone.mousemove @onMouseMoveSlider
        @slidableZone.mouseup @onMouseUpSlider

    onMouseMoveSlider: (event) =>
        event.preventDefault()
        @retrieveVolumeValue(event)

    onMouseUpSlider: (event) =>
        event.preventDefault()
        @slidableZone.off 'mousemove'
        @slidableZone.off 'mouseup'

    onClickToggleMute: (event) =>
        event.preventDefault()
        @toggleMute()

    volUp: =>
        @volumeValue += 10
        @controlVolumeValue()

    volDown: =>
        @volumeValue -= 10
        @controlVolumeValue()

    retrieveVolumeValue: (event)->
        handlePositionPx = event.clientX - @sliderContainer.offset().left
        handlePositionPercent = handlePositionPx/@sliderContainer.width() * 100
        @volumeValue = handlePositionPercent.toFixed(0)
        @controlVolumeValue()

    controlVolumeValue: ->
        @volumeValue = 100 if @volumeValue > 100
        if @volumeValue < 0
            @volumeValue = 0
            @toggleMute() unless @isMuted
        @toggleMute() if @volumeValue > 0 and @isMuted
        @updateDisplay()

    updateDisplay: ->
        Backbone.Mediator.publish 'volumeManager:volumeChanged', @volumeValue
        newWidth = if @isMuted then 0 else @volumeValue
        @sliderInner.width "#{newWidth}%"

    toggleMute: =>
        Backbone.Mediator.publish 'volumeManager:toggleMute', @volumeValue
        toggledClasses = 'icon-volume-up icon-volume-off activated'
        @$('#volume-switch-button i').toggleClass toggledClasses
        @isMuted = not @isMuted
        @updateDisplay()