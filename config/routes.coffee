exports.routes = (map) ->
    # tracks
    map.get 'tracks', 'tracks#all'
    map.post 'tracks', 'tracks#create'
    #:id means that this part of the route should be considered
    # as a variable called ID.
    map.del 'tracks/:id', 'tracks#destroy'
    map.get 'tracks/:id/attach/:fileName', 'tracks#getAttachment'

    # playlists
    map.get 'playlists', 'playlists#all'
    map.post 'playlists', 'playlists#create'
    map.get 'playlists/:id', 'playlists#show'
    map.del 'playlists/:id', 'playlists#destroy'