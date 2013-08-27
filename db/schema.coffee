Track = define 'Track', ->
    property 'title', String
    property 'artist', String
    property 'album', String
    property 'track', String
    property 'year', String
    property 'genre', String
    property 'time', String
    property 'slug', String
    property '_attachments', Object
    property 'playlists', Object
    property 'dateAdded', Date, default: Date.now
    property 'lastPlay', Date
    property 'plays', Number, default: 0

Playlist = define 'Playlist', ->
    property 'title', String