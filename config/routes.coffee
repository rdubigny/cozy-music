exports.routes = (map) ->
    # tracks
    map.get 'tracks', 'tracks#all'
    map.put 'tracks/:id', 'tracks#update'
    map.post 'tracks', 'tracks#create'
    map.get 'you/:url', 'tracks#youtube'
    map.del 'tracks/:id', 'tracks#destroy'
    map.get 'tracks/:id/attach/:fileName', 'tracks#getAttachment'

    # playlists
    map.get 'playlists', 'playlists#all'
    map.post 'playlists', 'playlists#create'
    map.del 'playlists/:id', 'playlists#destroy'

    map.get 'playlists/:id', 'playlists#show'
    map.put 'playlists/:playlistid/:id/:lastWeight', 'tracks#add'
    map.del 'playlists/:playlistid/:id', 'tracks#remove'
    map.put 'playlists/:playlistid/prev/:prevWeight/next/:nextWeight/:id', 'tracks#move'
