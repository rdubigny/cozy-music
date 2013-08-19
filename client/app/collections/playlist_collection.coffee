Playlist = require '../models/playlist'

module.exports = class PlaylistCollection extends Backbone.Collection

    # Model that will be contained inside the collection.
    model: Playlist

    # This is where ajax requests the backend.
    url: 'playlists'