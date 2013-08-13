Track = define 'Track', ->
    property 'title', String
    property 'artist', String
    property 'album', String
    property 'track', String
    property 'slug', String
    property '_attachments', Object
    property 'playlists', Object

Playlist = define 'Playlist', ->
    property 'title', String