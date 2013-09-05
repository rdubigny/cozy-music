Track = require '../models/track'

module.exports = class PlaylistTrackCollection extends Backbone.Collection

    # Model that will be contained inside the collection.
    model: Track

    add: (track)=>
        track.sync 'update', track,
            url: "#{@url}/#{track.id}"
            error: (xhr)=>
                msg = JSON.parse xhr.responseText
                alert "fail to add track : #{msg.error}"
        # avoiding calling super if an error occured
        @listenToOnce track, 'sync', super

    remove: (track)->
        track.sync 'delete', track,
            url: "#{@url}/#{track.id}"
            error: (xhr)->
                msg = JSON.parse xhr.responseText
                alert "fail to remove track : #{msg.error}"
        # avoiding calling super if an error occured
        @listenToOnce track, 'sync', super