Track = require '../models/track'

module.exports = class PlaylistTrackCollection extends Backbone.Collection

    # Model that will be contained inside the collection.
    model: Track