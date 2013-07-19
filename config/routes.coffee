exports.routes = (map) ->
    map.get 'tracks', 'tracks#all'
    map.post 'tracks', 'tracks#create'
    #:id means that this part of the route should be considered
    # as a variable called ID.
    map.del 'tracks/:id', 'tracks#destroy'
    map.get 'tracks/:id/attach/:title', 'tracks#getAttachment'