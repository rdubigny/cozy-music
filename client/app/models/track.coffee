module.exports = class Track extends Backbone.Model

    # This field is required to know from where data should be loaded.
    # We'll cover it better in the backend part.
    rootUrl: 'tracks'

    defaults: ->
        # values are :
        #   'client', 'uploadStart', 'uploadEnd', 'server', 'canceled'
        state: 'server'

    # patch Model.sync so it could trigger progress event
    sync: (method, model, options)->
        progress = (e)->
            model.trigger('progress', e)

        _.extend options,
            xhr: ()->
                xhr = $.ajaxSettings.xhr()
                if xhr instanceof window.XMLHttpRequest
                    xhr.addEventListener 'progress', progress, false
                if xhr.upload
                    xhr.upload.addEventListener 'progress', progress, false
                xhr

        Backbone.sync.apply @, arguments