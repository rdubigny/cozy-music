###
  Tiny Scrollbar
  http://www.baijs.nl/tinyscrollbar/

  Dual licensed under the MIT or GPL Version 2 licenses.
  http://www.opensource.org/licenses/mit-license.php
  http://www.opensource.org/licenses/gpl-2.0.php

  Date: 13 / 08 / 2012
  @version 1.81
  @author Maarten Baijs
###

module.exports = class ScrollBar

    $.tiny = $.tiny or {}

    $.tiny.scrollbar = options:
        axis: "y" # vertical or horizontal scrollbar? ( x || y ).
        wheel: 40 # how many pixels must the mouswheel scroll at a time.
        scroll: true # enable or disable the mousewheel.
        lockscroll: true # return scrollwheel to browser if there is no more content.
        size: "auto" # set the size of the scrollbar to auto or a fixed number.
        sizethumb: "auto" # set the size of the thumb to auto or a fixed number.
        invertscroll: false # Enable mobile invert style scrolling

    $.fn.tinyscrollbar = (params) ->
        options = $.extend({}, $.tiny.scrollbar.options, params)
        @each ->
            $(this).data "tsb", new Scrollbar($(this), options)

        this

    $.fn.tinyscrollbar_update = (sScroll) ->
        $(this).data("tsb").update sScroll





    Scrollbar = (root, options) ->

        initialize = ->
            oSelf.update()
            setEvents()
            oSelf

        setSize = ->
            sCssSize = sSize.toLowerCase()
            oThumb.obj.css sDirection, iScroll / oScrollbar.ratio
            oContent.obj.css sDirection, -iScroll
            iMouse.start = oThumb.obj.offset()[sDirection]
            oScrollbar.obj.css sCssSize, oTrack[options.axis]
            oTrack.obj.css sCssSize, oTrack[options.axis]
            oThumb.obj.css sCssSize, oThumb[options.axis]

        setEvents = ->
            unless touchEvents
                oThumb.obj.bind "mousedown", start
                oTrack.obj.bind "mouseup", drag
            else
                oViewport.obj[0].ontouchstart = (event) ->
                    if 1 is event.touches.length
                        start event.touches[0]
                        event.stopPropagation()
            if options.scroll and window.addEventListener
                oWrapper[0].addEventListener "DOMMouseScroll", wheel, false
                oWrapper[0].addEventListener "mousewheel", wheel, false
                oWrapper[0].addEventListener "MozMousePixelScroll", ((event) ->
                    event.preventDefault()
                ), false
            else oWrapper[0].onmousewheel = wheel  if options.scroll

        start = (event) ->
            $("body").addClass "noSelect"
            oThumbDir = parseInt(oThumb.obj.css(sDirection), 10)
            iMouse.start = (if sAxis then event.pageX else event.pageY)
            iPosition.start = (if oThumbDir is "auto" then 0 else oThumbDir)
            unless touchEvents
                $(document).bind "mousemove", drag
                $(document).bind "mouseup", end
                oThumb.obj.bind "mouseup", end
            else
                document.ontouchmove = (event) ->
                    event.preventDefault()
                    drag event.touches[0]

                document.ontouchend = end

        wheel = (event) ->
            if oContent.ratio < 1
                oEvent = event or window.event
                iDelta = (if oEvent.wheelDelta then oEvent.wheelDelta / 120 else -oEvent.detail / 3)
                iScroll -= iDelta * options.wheel
                iScroll = Math.min((oContent[options.axis] - oViewport[options.axis]), Math.max(0, iScroll))
                oThumb.obj.css sDirection, iScroll / oScrollbar.ratio
                oContent.obj.css sDirection, -iScroll
                if options.lockscroll or (iScroll isnt (oContent[options.axis] - oViewport[options.axis]) and iScroll isnt 0)
                    oEvent = $.event.fix(oEvent)
                    oEvent.preventDefault()

        drag = (event) ->
            if oContent.ratio < 1
                if options.invertscroll and touchEvents
                    iPosition.now = Math.min((oTrack[options.axis] - oThumb[options.axis]), Math.max(0, (iPosition.start + (iMouse.start - ((if sAxis then event.pageX else event.pageY))))))
                else
                    iPosition.now = Math.min((oTrack[options.axis] - oThumb[options.axis]), Math.max(0, (iPosition.start + (((if sAxis then event.pageX else event.pageY)) - iMouse.start))))
                iScroll = iPosition.now * oScrollbar.ratio
                oContent.obj.css sDirection, -iScroll
                oThumb.obj.css sDirection, iPosition.now

        end = ->
            $("body").removeClass "noSelect"
            $(document).unbind "mousemove", drag
            $(document).unbind "mouseup", end
            oThumb.obj.unbind "mouseup", end
            document.ontouchmove = document.ontouchend = null

        oSelf = this
        oWrapper = root
        oViewport = obj: $(".viewport", root)
        oContent = obj: $(".overview", root)
        oScrollbar = obj: $(".scrollbar", root)
        oTrack = obj: $(".track", oScrollbar.obj)
        oThumb = obj: $(".thumb", oScrollbar.obj)
        sAxis = options.axis is "x"
        sDirection = (if sAxis then "left" else "top")
        sSize = (if sAxis then "Width" else "Height")
        iScroll = 0
        iPosition =
            start: 0
            now: 0
        iMouse = {}

        # ontouchstart appens every time a finger is placed on the screen
        touchEvents = "ontouchstart" of document.documentElement

        @update = (sScroll) ->
            oViewport[options.axis] = oViewport.obj[0]["offset" + sSize]
            oContent[options.axis] = oContent.obj[0]["scroll" + sSize]
            oContent.ratio = oViewport[options.axis] / oContent[options.axis]
            oScrollbar.obj.toggleClass "disable", oContent.ratio >= 1
            oTrack[options.axis] = (if options.size is "auto" then oViewport[options.axis] else options.size)
            oThumb[options.axis] = Math.min(oTrack[options.axis], Math.max(0, ((if options.sizethumb is "auto" then (oTrack[options.axis] * oContent.ratio) else options.sizethumb))))
            oScrollbar.ratio = (if options.sizethumb is "auto" then (oContent[options.axis] / oTrack[options.axis]) else (oContent[options.axis] - oViewport[options.axis]) / (oTrack[options.axis] - oThumb[options.axis]))
            iScroll = (if (sScroll is "relative" and oContent.ratio <= 1) then Math.min((oContent[options.axis] - oViewport[options.axis]), Math.max(0, iScroll)) else 0)
            iScroll = (if (sScroll is "bottom" and oContent.ratio <= 1) then (oContent[options.axis] - oViewport[options.axis]) else (if isNaN(parseInt(sScroll, 10)) then iScroll else parseInt(sScroll, 10)))
            setSize()

        initialize()