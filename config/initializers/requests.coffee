module.exports = (compound) ->

    Track = compound.models.Track

    all = (doc) ->
        # That means retrieve all docs and order them by title.
        emit doc.title, doc

    Track.defineRequest "all", all, (err) ->
        if err
            compound.logger.write "Track.All requests, cannot be created"
            compound.logger.write err