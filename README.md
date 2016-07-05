#### This project is not maintained anymore

Please refer to https://github.com/cozy-labs/cozy-music.

# Description

Cozic is a music player developed to fill my needs for my Cozy Cloud. It uses SoundManager2 javascript library. 

If you want to test it go to https://demo.cozycloud.cc/#apps/cozic/ .

shortcuts enabled :
- spacebar : play/pause
- "b" : previous track
- "n" : next track
- "-" : volume down
- "+" : volume up
- "m" : mute
- "v" : switch between tracks view and play-queue view

### NB

For now, it's impossible to upload file from IE.

### Warning

Don't try to upload songs from multiple devices simultaneously or you'll regret it.

# Run

Clone this repository, install dependencies and run server (it requires Node.js
and Coffee-script)

    git clone git://github.com/rdubigny/cozy-music.git
    cd cozy-music
    npm install
    coffee server.coffee

# About Cozy

This app is suited to be deployed on the Cozy platform. Cozy is the personal
server for everyone. It allows you to install your every day web applications
easily on your server, a single place you control. This means you can manage
efficiently your data while protecting your privacy without technical skills.

More informations and hosting services on:
http://cozycloud.cc

# Cozy on IRC
Feel free to check out our IRC channel (#cozycloud at freenode.net) if you have
any technical issues/inquiries or simply to speak about Cozy Cloud in general.
