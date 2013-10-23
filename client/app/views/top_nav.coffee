BaseView = require 'lib/base_view'
app = require 'application'
uploader = require 'models/uploader'

module.exports = class TopNav extends BaseView

    className: 'top-nav'
    tagName: 'div'
    template: require('views/templates/top_nav')

    # Register listener
    events:
        'click #upload-form' : 'onClick'
        'click #youtube-import' : 'onClickYoutube'


    subscriptions:
        'tracklist:isEmpty': 'onEmptyTrackList'

    afterRender: ->
        @setupHiddenFileInput()

    onEmptyTrackList: ->
        @$('td#h2').html "Drop files here or click to add tracks"

    setupHiddenFileInput: =>
        document.body.removeChild @hiddenFileInput if @hiddenFileInput
        # create a hidden input file and append it at the end of the document
        @hiddenFileInput = document.createElement "input"
        @hiddenFileInput.setAttribute "type", "file"
        @hiddenFileInput.setAttribute "multiple", "multiple"
        @hiddenFileInput.setAttribute "accept", "audio/*"
        # Not setting `display="none"` because some browsers don't accept clicks
        # on elements that aren't displayed.
        @hiddenFileInput.style.visibility = "hidden"
        @hiddenFileInput.style.position = "absolute"
        @hiddenFileInput.style.top = "0"
        @hiddenFileInput.style.left = "0"
        @hiddenFileInput.style.height = "0"
        @hiddenFileInput.style.width = "0"
        document.body.appendChild @hiddenFileInput
        @hiddenFileInput.addEventListener "change", @onUploadFormChange

    onUploadFormChange: (event)=>
        # fetch files
        @handleFiles @hiddenFileInput.files

        # clear input field
        @setupHiddenFileInput()

    onClick: (event)->
        event.preventDefault()
        event.stopPropagation()
        # Forward the click
        @hiddenFileInput.click()

    # event listeners for D&D events
    onFilesDropped: (event) =>
        event.preventDefault()
        event.stopPropagation()
        @$el.removeClass 'dragover'
        $('.player').removeClass 'dragover'
        # fetch files
        event.dataTransfer = event.originalEvent.dataTransfer
        @handleFiles event.dataTransfer.files

    onDragOver: (event) =>
        event.preventDefault() # allow drop
        event.stopPropagation()
        unless @$el.hasClass 'dragover'
            @$el.addClass 'dragover'
            $('.player').addClass 'dragover'

    onDragOut: (event) =>
        event.preventDefault() # allow drop
        event.stopPropagation()
        if @$el.hasClass 'dragover'
            @$el.removeClass 'dragover'
            $('.player').removeClass 'dragover'

    handleFiles: (files)=>
        # if not on home, go to home
        curUrl = "#{document.URL}"
        if curUrl.match(/playlist/) or curUrl.match(/playqueue/)
            app.router.navigate '', true

        uploader.process files

    onClickYoutube: (e) =>
        defaultMsg = "Please enter a youtube url :"
        defaultVal = "http://www.youtube.com/watch?v=KMU0tzLwhbE"
        isValidInput = false
        until isValidInput
            input = prompt defaultMsg, defaultVal
            # if user canceled the operation
            return unless input?
            # if https then turn it into http
            if input.match /^https/
                input = input.replace /^https:\/\//i, 'http://'
            if input.match /^http:\/\/www.youtube.com\/watch?/
                startIndex = input.search(/v=/) + 2
                isValidInput = true
                youId = input.substr startIndex, 11
            else if input.match /^http:\/\/youtu.be\//
                isValidInput = true
                youId = input.substr 16, 11
            else if input.length is 11
                isValidInput = true
                youId = input
            defaultMsg = "Invalid youtube url, please try again :"
            defaultVal = input

        # if not on home, go to home
        curUrl = "#{document.URL}"
        if curUrl.match(/playlist/) or curUrl.match(/playqueue/)
            app.router.navigate '', true

        uploader.processYoutube youId