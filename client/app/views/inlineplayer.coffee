###
SoundManager 2 Demo: Play MP3 links "in-place"
----------------------------------------------

http://schillmania.com/projects/soundmanager2/

A simple demo making MP3s playable "inline"
and easily styled/customizable via CSS.

Requires SoundManager 2 Javascript API.
###

module.exports = class InlinePlayer
    constructor: ->
        self = this
        pl = this
        sm = soundManager # soundManager instance
        isIE = (navigator.userAgent.match(/msie/i))
        @playableClass = "inline-playable" # CSS class for forcing a link to be playable (eg. doesn't have .MP3 in it)
        @excludeClass = "inline-exclude" # CSS class for ignoring MP3 links
        @links = []
        @sounds = []
        @soundsByURL = []
        @indexByURL = []
        @lastSound = null
        @soundCount = 0
        @config =
            playNext: false # stop after one sound, or play through list until end
            autoPlay: false # start playing the first sound right away

        @css =
        
            # CSS class names appended to link during various states
            sDefault: "sm2_link" # default state
            sLoading: "sm2_loading"
            sPlaying: "sm2_playing"
            sPaused: "sm2_paused"

        @addEventHandler = ((if typeof window.addEventListener isnt "undefined" then (o, evtName, evtHandler) ->
            o.addEventListener evtName, evtHandler, false
        else (o, evtName, evtHandler) ->
            o.attachEvent "on" + evtName, evtHandler
        ))
        @removeEventHandler = ((if typeof window.removeEventListener isnt "undefined" then (o, evtName, evtHandler) ->
            o.removeEventListener evtName, evtHandler, false
        else (o, evtName, evtHandler) ->
            o.detachEvent "on" + evtName, evtHandler
        ))
        @classContains = (o, cStr) ->
            (if typeof (o.className) isnt "undefined" then o.className.match(new RegExp("(\\s|^)" + cStr + "(\\s|$)")) else false)

        @addClass = (o, cStr) ->
            return false  if not o or not cStr or self.classContains(o, cStr)
            o.className = ((if o.className then o.className + " " else "")) + cStr

        @removeClass = (o, cStr) ->
            return false  if not o or not cStr or not self.classContains(o, cStr)
            o.className = o.className.replace(new RegExp("( " + cStr + ")|(" + cStr + ")", "g"), "")

        @getSoundByURL = (sURL) ->
            (if typeof self.soundsByURL[sURL] isnt "undefined" then self.soundsByURL[sURL] else null)

        @isChildOfNode = (o, sNodeName) ->
            return false  if not o or not o.parentNode
            sNodeName = sNodeName.toLowerCase()
            loop
                o = o.parentNode
                break unless o and o.parentNode and o.nodeName.toLowerCase() isnt sNodeName
            (if o.nodeName.toLowerCase() is sNodeName then o else null)

        @events =
        
            # handlers for sound events as they're started/stopped/played
            play: ->
                pl.removeClass @_data.oLink, @_data.className
                @_data.className = pl.css.sPlaying
                pl.addClass @_data.oLink, @_data.className

            stop: ->
                pl.removeClass @_data.oLink, @_data.className
                @_data.className = ""

            pause: ->
                pl.removeClass @_data.oLink, @_data.className
                @_data.className = pl.css.sPaused
                pl.addClass @_data.oLink, @_data.className

            resume: ->
                pl.removeClass @_data.oLink, @_data.className
                @_data.className = pl.css.sPlaying
                pl.addClass @_data.oLink, @_data.className

            finish: ->
                pl.removeClass @_data.oLink, @_data.className
                @_data.className = ""
                if pl.config.playNext
                    nextLink = (pl.indexByURL[@_data.oLink.href] + 1)
                    pl.handleClick target: pl.links[nextLink]  if nextLink < pl.links.length

        @stopEvent = (e) ->
            if typeof e isnt "undefined" and typeof e.preventDefault isnt "undefined"
                e.preventDefault()
            else event.returnValue = false  if typeof event isnt "undefined" and typeof event.returnValue isnt "undefined"
            false

        @getTheDamnLink = (if (isIE) then (e) ->
            # I really didn't want to have to do this.
            (if e and e.target then e.target else window.event.srcElement)
        else (e) ->
            e.target
        )

        @handleClick = (e) ->
        
            # a sound link was clicked
        
            # ignore right-click
            return true  if typeof e.button isnt "undefined" and e.button > 1
            o = self.getTheDamnLink(e)
            unless o.nodeName.toLowerCase() is "a"
                o = self.isChildOfNode(o, "a")
                return true  unless o
            sURL = o.getAttribute("href")
            return true  if not o.href or (not sm.canPlayLink(o) and not self.classContains(o, self.playableClass)) or self.classContains(o, self.excludeClass) # pass-thru for non-MP3/non-links
            soundURL = (o.href)
            thisSound = self.getSoundByURL(soundURL)
            if thisSound
          
                # already exists
                if thisSound is self.lastSound
            
                    # and was playing (or paused)
                    thisSound.togglePause()
                else
            
                    # different sound
                    sm._writeDebug "sound different than last sound: " + self.lastSound.id
                    self.stopSound self.lastSound  if self.lastSound
                    thisSound.togglePause() # start playing current
            else
          
                # stop last sound
                self.stopSound self.lastSound  if self.lastSound
          
                # create sound
                thisSound = sm.createSound(
                    id: "inlineMP3Sound" + (self.soundCount++)
                    url: soundURL
                    onplay: self.events.play
                    onstop: self.events.stop
                    onpause: self.events.pause
                    onresume: self.events.resume
                    onfinish: self.events.finish
                    type: (o.type or null)
                )
          
                # tack on some custom data
                thisSound._data =
                    oLink: o # DOM node for reference within SM2 object event handlers
                    className: self.css.sPlaying

                self.soundsByURL[soundURL] = thisSound
                self.sounds.push thisSound
                thisSound.play()
            self.lastSound = thisSound # reference for next call
            if typeof e isnt "undefined" and typeof e.preventDefault isnt "undefined"
                e.preventDefault()
            else
                event.returnValue = false
            false

        @stopSound = (oSound) ->
            soundManager.stop oSound.id
            soundManager.unload oSound.id

        @init = ->
            sm._writeDebug "inlinePlayer.init()"
            oLinks = document.getElementsByTagName("a")
            # grab all links, look for .mp3
            foundItems = 0
            i = 0
            j = oLinks.length
            while i < j
                if (sm.canPlayLink(oLinks[i]) or self.classContains(oLinks[i], self.playableClass)) and not self.classContains(oLinks[i], self.excludeClass)
                    self.addClass oLinks[i], self.css.sDefault # add default CSS decoration
                    self.links[foundItems] = (oLinks[i])
                    self.indexByURL[oLinks[i].href] = foundItems # hack for indexing
                    foundItems++
                i++
            if foundItems > 0
                self.addEventHandler document, "click", self.handleClick
                if self.config.autoPlay
                    self.handleClick
                        target: self.links[0]
                        preventDefault: ->
            sm._writeDebug "inlinePlayer.init(): Found " + foundItems + " relevant items."

        @init()