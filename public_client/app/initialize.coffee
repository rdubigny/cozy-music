Application = require 'application'

# The function called from index.html
$ ->
    require 'lib/app_helpers'
    app = new Application()
    app.initialize()