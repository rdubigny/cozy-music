# this controller differs from the others, it's a NOEVAL compound controller
broadcastInfo = require '../models/broadcast_info'

BroadcastController = module.exports = (init) ->

# start broadcast
BroadcastController.prototype.enableBroadcast = (c)->
    broadcastInfo.broadcastEnabled = true
    c.send success: 'broadcast info successfully updated', 200

# stop broadcast
BroadcastController.prototype.disableBroadcast = (c)->
    broadcastInfo.broadcastEnabled = false
    c.send success: 'broadcast info successfully updated', 200

# write track informations
BroadcastController.prototype.writeUrl = (c) ->
    broadcastInfo.lastPlayUrl = c.req.params.url
    broadcastInfo.lastPlayTitle = c.req.params.title
    broadcastInfo.lastPlayArtist = c.req.params.artist
    c.send success: 'broadcast info successfully updated', 200

# read track information if broadcast is enabled
BroadcastController.prototype.readUrl = (c) ->
    if  broadcastInfo.broadcastEnabled and broadcastInfo.lastPlayUrl?
        c.send
            url: broadcastInfo.lastPlayUrl
            title: broadcastInfo.lastPlayTitle
            artist: broadcastInfo.lastPlayArtist
        , 200
    else
        c.send error: 'Broadcast currently disabled', 204