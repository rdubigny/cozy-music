Track = define 'Track', ->
    property 'title', String
    property 'artist', String
    property 'album', String
    property 'track', String
    property 'year', String
    property 'genre', String
    property 'duration', String
    property 'slug', String
    property '_attachments', Object
    property 'playlists', Object
    property 'additionDate', Date, default: Date.now
    property 'lastPlayDate', Date
    property 'playTime', Number, default: 0

Playlist = define 'Playlist', ->
    property 'title', String