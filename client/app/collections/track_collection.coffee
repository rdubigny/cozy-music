Track = require '../models/track'

module.exports = class TrackCollection extends Backbone.Collection

    # Model that will be contained inside the collection.
    model: Track

    # This is where ajax requests the backend.
    url: 'tracks'