(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.brunch = true;
})();

window.require.register("application", function(exports, require, module) {
  module.exports = {
    initialize: function() {
      var Router, TrackCollection,
        _this = this;
      Router = require('router');
      this.router = new Router();
      TrackCollection = require('collections/track_collection');
      this.tracks = new TrackCollection();
      this.tracks.fetch({
        error: function() {
          var msg;
          msg = "Files couldn't be retrieved due to a server error.";
          return alert(msg);
        }
      });
      this.soundManager = soundManager;
      this.soundManager.setup({
        debugMode: true,
        debugFlash: false,
        useFlashBlock: false,
        preferFlash: true,
        flashPollingInterval: 500,
        html5PollingInterval: 500,
        url: "swf/",
        flashVersion: 9,
        onready: function() {
          return $('.button.play').toggleClass('stopped loading');
        },
        ontimeout: function() {
          return $('.button.play').toggleClass('unplayable loading');
        }
      });
      Backbone.history.start();
      if (typeof Object.freeze === 'function') {
        return Object.freeze(this);
      }
    }
  };
  
});
window.require.register("collections/playqueue", function(exports, require, module) {
  var PlayQueue, Track, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Track = require('../models/track');

  module.exports = PlayQueue = (function(_super) {
    __extends(PlayQueue, _super);

    function PlayQueue() {
      _ref = PlayQueue.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PlayQueue.prototype.atPlay = 0;

    PlayQueue.prototype.model = Track;

    PlayQueue.prototype.url = 'playqueue';

    PlayQueue.prototype.playLoop = false;

    PlayQueue.prototype.getCurrentTrack = function() {
      var _ref1;
      if ((0 <= (_ref1 = this.atPlay) && _ref1 < this.length)) {
        return this.at(this.atPlay);
      } else {
        return null;
      }
    };

    PlayQueue.prototype.getNextTrack = function() {
      if (this.atPlay < this.length - 1) {
        this.atPlay += 1;
        return this.at(this.atPlay);
      } else if (this.playLoop && this.length > 0) {
        this.atPlay = 0;
        return this.at(this.atPlay);
      } else {
        return null;
      }
    };

    PlayQueue.prototype.getPrevTrack = function() {
      if (this.atPlay > 0) {
        this.atPlay -= 1;
        return this.at(this.atPlay);
      } else if (this.playLoop && this.length > 0) {
        this.atPlay = this.length - 1;
        return this.at(this.atPlay);
      } else {
        return null;
      }
    };

    PlayQueue.prototype.queue = function(track) {
      this.push(track, {
        sort: false
      });
      return this.show();
    };

    PlayQueue.prototype.pushNext = function(track) {
      if (this.length > 0) {
        this.add(track, {
          at: this.atPlay + 1
        });
      } else {
        this.add(track);
      }
      return this.show();
    };

    PlayQueue.prototype.show = function() {
      var curM, i, _i, _ref1, _results;
      console.log("PlayQueue content :");
      if (this.length >= 1) {
        _results = [];
        for (i = _i = 0, _ref1 = this.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          curM = this.models[i];
          _results.push(console.log(i + ") " + curM.attributes.title));
        }
        return _results;
      }
    };

    return PlayQueue;

  })(Backbone.Collection);
  
});
window.require.register("collections/track_collection", function(exports, require, module) {
  var Track, TrackCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Track = require('../models/track');

  module.exports = TrackCollection = (function(_super) {
    __extends(TrackCollection, _super);

    function TrackCollection() {
      _ref = TrackCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TrackCollection.prototype.model = Track;

    TrackCollection.prototype.url = 'tracks';

    return TrackCollection;

  })(Backbone.Collection);
  
});
window.require.register("initialize", function(exports, require, module) {
  var app;

  app = require('application');

  $(function() {
    require('lib/app_helpers');
    return app.initialize();
  });
  
});
window.require.register("lib/app_helpers", function(exports, require, module) {
  (function() {
    return (function() {
      var console, dummy, method, methods, _results;
      console = window.console = window.console || {};
      method = void 0;
      dummy = function() {};
      methods = 'assert,count,debug,dir,dirxml,error,exception,\
                   group,groupCollapsed,groupEnd,info,log,markTimeline,\
                   profile,profileEnd,time,timeEnd,trace,warn'.split(',');
      _results = [];
      while (method = methods.pop()) {
        _results.push(console[method] = console[method] || dummy);
      }
      return _results;
    })();
  })();
  
});
window.require.register("lib/base_view", function(exports, require, module) {
  var BaseView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = BaseView = (function(_super) {
    __extends(BaseView, _super);

    function BaseView() {
      _ref = BaseView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BaseView.prototype.template = function() {};

    BaseView.prototype.initialize = function() {};

    BaseView.prototype.getRenderData = function() {
      var _ref1;
      return {
        model: (_ref1 = this.model) != null ? _ref1.toJSON() : void 0
      };
    };

    BaseView.prototype.render = function() {
      this.beforeRender();
      this.$el.html(this.template(this.getRenderData()));
      this.afterRender();
      return this;
    };

    BaseView.prototype.beforeRender = function() {};

    BaseView.prototype.afterRender = function() {};

    BaseView.prototype.destroy = function() {
      this.undelegateEvents();
      this.$el.removeData().unbind();
      this.remove();
      return Backbone.View.prototype.remove.call(this);
    };

    return BaseView;

  })(Backbone.View);
  
});
window.require.register("lib/view_collection", function(exports, require, module) {
  var BaseView, ViewCollection, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('lib/base_view');

  module.exports = ViewCollection = (function(_super) {
    __extends(ViewCollection, _super);

    function ViewCollection() {
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      _ref = ViewCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ViewCollection.prototype.itemview = null;

    ViewCollection.prototype.views = {};

    ViewCollection.prototype.template = function() {
      return '';
    };

    ViewCollection.prototype.collectionEl = null;

    ViewCollection.prototype.onChange = function() {
      return this.$el.toggleClass('empty', _.size(this.views) === 0);
    };

    ViewCollection.prototype.appendView = function(view) {
      var className, index, selector, tagName;
      index = this.collection.indexOf(view.model);
      if (index === 0) {
        return this.$collectionEl.prepend(view.$el);
      } else {
        if (view.className != null) {
          className = "." + view.className;
        } else {
          className = "";
        }
        if (view.tagName != null) {
          tagName = view.tagName;
        } else {
          tagName = "";
        }
        selector = "" + tagName + className + ":nth-of-type(" + index + ")";
        return this.$collectionEl.find(selector).after(view.$el);
      }
    };

    ViewCollection.prototype.initialize = function() {
      var collectionEl;
      ViewCollection.__super__.initialize.apply(this, arguments);
      this.listenTo(this.collection, "reset", this.onReset);
      this.listenTo(this.collection, "add", this.addItem);
      this.listenTo(this.collection, "remove", this.removeItem);
      this.on("change", this.onChange);
      if (this.collectionEl == null) {
        return collectionEl = el;
      }
    };

    ViewCollection.prototype.render = function() {
      var id, view, _ref1;
      _ref1 = this.views;
      for (id in _ref1) {
        view = _ref1[id];
        view.$el.detach();
      }
      return ViewCollection.__super__.render.apply(this, arguments);
    };

    ViewCollection.prototype.afterRender = function() {
      var id, view, _ref1;
      ViewCollection.__super__.afterRender.apply(this, arguments);
      this.$collectionEl = $(this.collectionEl);
      _ref1 = this.views;
      for (id in _ref1) {
        view = _ref1[id];
        this.appendView(view.$el);
      }
      this.onReset(this.collection);
      return this.trigger('change');
    };

    ViewCollection.prototype.remove = function() {
      this.onReset([]);
      return ViewCollection.__super__.remove.apply(this, arguments);
    };

    ViewCollection.prototype.onReset = function(newcollection) {
      var id, view, _ref1;
      _ref1 = this.views;
      for (id in _ref1) {
        view = _ref1[id];
        view.remove();
      }
      return newcollection.forEach(this.addItem);
    };

    ViewCollection.prototype.addItem = function(model) {
      var options, view;
      options = _.extend({}, {
        model: model
      });
      view = new this.itemview(options);
      this.views[model.cid] = view.render();
      this.appendView(view);
      return this.trigger('change');
    };

    ViewCollection.prototype.removeItem = function(model) {
      this.views[model.cid].remove();
      delete this.views[model.cid];
      return this.trigger('change');
    };

    return ViewCollection;

  })(BaseView);
  
});
window.require.register("models/track", function(exports, require, module) {
  var Track, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = Track = (function(_super) {
    __extends(Track, _super);

    function Track() {
      _ref = Track.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Track.prototype.rootUrl = 'tracks';

    Track.prototype.defaults = function() {
      return {
        state: 'server'
      };
    };

    Track.prototype.sync = function(method, model, options) {
      var progress;
      progress = function(e) {
        return model.trigger('progress', e);
      };
      _.extend(options, {
        xhr: function() {
          var xhr;
          xhr = $.ajaxSettings.xhr();
          if (xhr instanceof window.XMLHttpRequest) {
            xhr.addEventListener('progress', progress, false);
          }
          if (xhr.upload) {
            xhr.upload.addEventListener('progress', progress, false);
          }
          return xhr;
        }
      });
      return Backbone.sync.apply(this, arguments);
    };

    return Track;

  })(Backbone.Model);
  
});
window.require.register("router", function(exports, require, module) {
  var AppView, Router, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AppView = require('views/app_view');

  module.exports = Router = (function(_super) {
    __extends(Router, _super);

    function Router() {
      _ref = Router.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Router.prototype.routes = {
      '': 'main'
    };

    Router.prototype.main = function() {
      var mainView;
      mainView = new AppView();
      return mainView.render();
    };

    return Router;

  })(Backbone.Router);
  
});
window.require.register("views/app_view", function(exports, require, module) {
  var AppView, BaseView, OffScreenNav, Player, TrackList, Uploader, app, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  Uploader = require('./uploader');

  TrackList = require('./tracklist');

  Player = require('./player/player');

  OffScreenNav = require('./off_screen_nav');

  app = require('application');

  module.exports = AppView = (function(_super) {
    __extends(AppView, _super);

    function AppView() {
      _ref = AppView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AppView.prototype.el = 'body.application';

    AppView.prototype.template = require('./templates/home');

    AppView.prototype.afterRender = function() {
      this.uploader = new Uploader;
      this.$('#uploader').append(this.uploader.$el);
      this.uploader.render();
      this.trackList = new TrackList({
        collection: app.tracks
      });
      this.$('#tracks-display').append(this.trackList.$el);
      this.trackList.render();
      this.player = new Player();
      this.$('#player').append(this.player.$el);
      this.player.render();
      this.offScreenNav = new OffScreenNav();
      this.$('#off-screen-nav').append(this.offScreenNav.$el);
      return this.offScreenNav.render();
    };

    return AppView;

  })(BaseView);
  
});
window.require.register("views/off_screen_nav", function(exports, require, module) {
  
  /*
    Off screen nav view
  */
  var BaseView, OffScreenNav, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../../lib/base_view');

  module.exports = OffScreenNav = (function(_super) {
    __extends(OffScreenNav, _super);

    function OffScreenNav() {
      _ref = OffScreenNav.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    OffScreenNav.prototype.className = 'off-screen-nav';

    OffScreenNav.prototype.tagName = 'div';

    OffScreenNav.prototype.template = require('./templates/off_screen_nav');

    OffScreenNav.prototype.afterRender = function() {
      var _this = this;
      this.nav = $("off-screen-nav");
      this.closeButton = $("off-screen-nav-close");
      return $('#off-screen-nav').on('click', function(e) {
        return _this.$el.toggleClass('off-screen-nav-show');
      });
    };

    OffScreenNav.prototype.toggleNav = function() {
      return this.$el.toggleClass('off-screen-nav-show');
    };

    return OffScreenNav;

  })(BaseView);
  
});
window.require.register("views/player/player", function(exports, require, module) {
  
  /*
  Here is the player with some freaking awesome features like play and pause...
  */
  var BaseView, Player, VolumeManager, app, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../../lib/base_view');

  VolumeManager = require('./volumeManager');

  app = require('../../application');

  module.exports = Player = (function(_super) {
    __extends(Player, _super);

    function Player() {
      this.updateProgressDisplay = __bind(this.updateProgressDisplay, this);
      this.printLoadingInfo = __bind(this.printLoadingInfo, this);
      this.onToggleMute = __bind(this.onToggleMute, this);
      this.onVolumeChange = __bind(this.onVolumeChange, this);
      this.stopTrack = __bind(this.stopTrack, this);
      this.afterRender = __bind(this.afterRender, this);
      _ref = Player.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Player.prototype.className = 'player';

    Player.prototype.tagName = 'div';

    Player.prototype.template = require('../templates/player/player');

    Player.prototype.events = {
      'click .button.play': 'onClickPlay',
      'click .button.rwd': 'onClickRwd',
      'click .button.fwd': 'onClickFwd',
      'mousedown .progress': 'onMouseDownProgress',
      'click .loop': 'onClickLoop',
      'click .random': 'onClickRandom'
    };

    Player.prototype.subscriptions = {
      'track:queue': 'onQueueTrack',
      'track:playImmediate': 'onPlayImmediate',
      'track:pushNext': 'onPushNext',
      'track:stop': function(id) {
        var _ref1;
        if (((_ref1 = this.currentSound) != null ? _ref1.id : void 0) === id) {
          return this.stopTrack();
        }
      },
      'volumeManager:toggleMute': 'onToggleMute',
      'volumeManager:volumeChanged': 'onVolumeChange'
    };

    Player.prototype.afterRender = function() {
      var PlayQueue;
      PlayQueue = require('collections/playqueue');
      this.playQueue = new PlayQueue();
      this.playButton = this.$(".button.play");
      this.volume = 50;
      this.isMutted = false;
      this.volumeManager = new VolumeManager({
        initVol: this.volume
      });
      this.volumeManager.render();
      this.$('#volume').append(this.volumeManager.$el);
      this.elapsedTime = this.$('#elapsedTime');
      this.remainingTime = this.$('#remainingTime');
      this.progress = this.$('.progress');
      this.progressInner = this.$('.progress .inner');
      this.currentSound = null;
      this.progressInner.width("0%");
      this.elapsedTime.html("&nbsp;0:00");
      this.remainingTime.html("&nbsp;0:00");
      this.isStopped = true;
      return this.isPaused = false;
    };

    Player.prototype.onClickPlay = function() {
      if (!this.playButton.hasClass('loading')) {
        if (!this.playButton.hasClass('unplayable')) {
          if (this.currentSound != null) {
            if (this.isStopped) {
              this.currentSound.play();
              this.playButton.removeClass("stopped");
              return this.isStopped = false;
            } else if (this.isPaused) {
              this.currentSound.play();
              this.playButton.removeClass("paused");
              return this.isPaused = false;
            } else if (!this.isPaused && !this.isStopped) {
              this.currentSound.pause();
              this.playButton.addClass("paused");
              return this.isPaused = true;
            }
          } else if (this.playQueue.getCurrentTrack() != null) {
            if (this.isStopped) {
              this.playButton.removeClass("stopped");
              this.isStopped = false;
              return this.onPlayTrack(this.playQueue.getCurrentTrack());
            }
          }
        } else {
          return alert("application error : unable to play track");
        }
      }
    };

    Player.prototype.onClickRwd = function() {
      var prevTrack;
      if ((this.currentSound != null) && !this.isStopped && this.currentSound.position > 3000) {
        this.currentSound.setPosition(0);
        return this.updateProgressDisplay();
      } else {
        prevTrack = this.playQueue.getPrevTrack();
        if (prevTrack != null) {
          this.stopTrack();
          return this.onPlayTrack(prevTrack);
        }
      }
    };

    Player.prototype.onClickFwd = function() {
      var nextTrack;
      nextTrack = this.playQueue.getNextTrack();
      if (nextTrack != null) {
        this.stopTrack();
        return this.onPlayTrack(nextTrack);
      }
    };

    Player.prototype.onMouseDownProgress = function(event) {
      var handlePositionPx, percent;
      if (this.currentSound != null) {
        event.preventDefault();
        handlePositionPx = event.clientX - this.progress.offset().left;
        percent = handlePositionPx / this.progress.width();
        if (this.currentSound.durationEstimate * percent < this.currentSound.duration) {
          this.currentSound.setPosition(this.currentSound.durationEstimate * percent);
          return this.updateProgressDisplay();
        }
      }
    };

    Player.prototype.onQueueTrack = function(track) {
      return this.playQueue.queue(track);
    };

    Player.prototype.onPushNext = function(track) {
      return this.playQueue.pushNext(track);
    };

    Player.prototype.onPlayImmediate = function(track) {
      var nextTrack;
      this.playQueue.pushNext(track);
      if (this.playQueue.length === 1) {
        nextTrack = this.playQueue.getCurrentTrack();
      } else {
        nextTrack = this.playQueue.getNextTrack();
        if (this.currentSound != null) {
          if (this.currentSound.id === ("sound-" + (nextTrack.get('id')))) {
            this.currentSound.setPosition(0);
            this.updateProgressDisplay();
            return;
          }
          this.stopTrack();
        }
      }
      return this.onPlayTrack(nextTrack);
    };

    Player.prototype.onPlayTrack = function(track) {
      var nfo,
        _this = this;
      this.currentSound = app.soundManager.createSound({
        id: "sound-" + (track.get('id')),
        url: "tracks/" + (track.get('id')) + "/attach/" + (track.get('slug')),
        usePolicyFile: true,
        volume: this.volume,
        autoPlay: true,
        onfinish: function() {
          var nextTrack;
          _this.stopTrack();
          nextTrack = _this.playQueue.getNextTrack();
          if (nextTrack != null) {
            return _this.onPlayTrack(nextTrack);
          }
        },
        onstop: this.stopTrack,
        whileplaying: this.updateProgressDisplay,
        multiShot: false
      });
      if (this.isMutted) {
        this.currentSound.mute();
      }
      this.playButton.removeClass("stopped");
      this.isStopped = false;
      this.playButton.removeClass("paused");
      this.isPaused = false;
      nfo = "" + (track.get('title')) + " - <i>" + (track.get('artist')) + "</i>";
      return this.$('.id3-info').html(nfo);
    };

    Player.prototype.stopTrack = function() {
      if (this.currentSound != null) {
        this.currentSound.destruct();
        this.currentSound = null;
      }
      this.playButton.addClass("stopped");
      this.isStopped = true;
      this.playButton.removeClass("paused");
      this.isPaused = false;
      this.progressInner.width("0%");
      this.elapsedTime.html("&nbsp;0:00");
      this.remainingTime.html("&nbsp;0:00");
      return this.$('.id3-info').html("-");
    };

    Player.prototype.onVolumeChange = function(volume) {
      this.volume = volume;
      if (this.currentSound != null) {
        return this.currentSound.setVolume(volume);
      }
    };

    Player.prototype.onToggleMute = function() {
      this.isMutted = !this.isMutted;
      if (this.currentSound != null) {
        return this.currentSound.toggleMute();
      }
    };

    Player.prototype.formatMs = function(ms) {
      var m, s;
      s = Math.floor((ms / 1000) % 60);
      if (s < 10) {
        s = "0" + s;
      }
      m = Math.floor(ms / 60000);
      if (m < 10) {
        m = "&nbsp;" + m;
      }
      return "" + m + ":" + s;
    };

    Player.prototype.printLoadingInfo = function() {
      var buf, i, printBuf, tot, _i, _len, _ref1,
        _this = this;
      tot = this.currentSound.durationEstimate;
      console.log("is buffering : " + this.currentSound.isBuffering);
      console.log("buffered :");
      printBuf = function(buf) {
        return console.log("[" + (Math.floor(buf.start / tot * 100)) + "% - " + (Math.floor(buf.end / tot * 100)) + "%]");
      };
      _ref1 = this.currentSound.buffered;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        buf = _ref1[i];
        printBuf(this.currentSound.buffered[i]);
      }
      console.log("bytes loaded : " + (Math.floor(this.currentSound.bytesLoaded / this.currentSound.bytesTotal * 100)));
      return console.log("");
    };

    Player.prototype.updateProgressDisplay = function() {
      var newWidth, remainingTime;
      newWidth = this.currentSound.position / this.currentSound.durationEstimate * 100;
      this.progressInner.width("" + newWidth + "%");
      this.elapsedTime.html(this.formatMs(this.currentSound.position));
      remainingTime = this.currentSound.durationEstimate - this.currentSound.position;
      return this.remainingTime.html(this.formatMs(remainingTime));
    };

    Player.prototype.onClickLoop = function() {
      var loopButton;
      loopButton = this.$('.loop');
      loopButton.toggleClass('on');
      if (loopButton.hasClass('on')) {
        return this.playQueue.playLoop = true;
      } else {
        return this.playQueue.playLoop = false;
      }
    };

    Player.prototype.onClickRandom = function() {
      return alert('unavailable yet');
    };

    return Player;

  })(BaseView);
  
});
window.require.register("views/player/volumeManager", function(exports, require, module) {
  var BaseView, VolumeManager, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../../lib/base_view');

  module.exports = VolumeManager = (function(_super) {
    __extends(VolumeManager, _super);

    function VolumeManager() {
      this.onMouseUpSlider = __bind(this.onMouseUpSlider, this);
      this.onMouseMoveSlider = __bind(this.onMouseMoveSlider, this);
      _ref = VolumeManager.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    VolumeManager.prototype.className = "volume";

    VolumeManager.prototype.tagName = "div";

    VolumeManager.prototype.template = require('../templates/player/volumeManager');

    VolumeManager.prototype.events = {
      "mousedown .slider": "onMouseDownSlider",
      "click .volume-switch": "onClickToggleMute"
    };

    VolumeManager.prototype.initialize = function(options) {
      VolumeManager.__super__.initialize.apply(this, arguments);
      return this.volumeValue = options.initVol;
    };

    VolumeManager.prototype.afterRender = function() {
      this.isMuted = false;
      this.slidableZone = $(document);
      this.volumeSwitch = this.$(".volume-switch");
      this.slider = this.$(".slider");
      this.sliderContainer = this.$(".slider-container");
      this.sliderInner = this.$(".slider-inner");
      return this.sliderInner.width("" + this.volumeValue + "%");
    };

    VolumeManager.prototype.onMouseDownSlider = function(event) {
      event.preventDefault();
      this.retrieveVolumeValue(event);
      this.slidableZone.mousemove(this.onMouseMoveSlider);
      return this.slidableZone.mouseup(this.onMouseUpSlider);
    };

    VolumeManager.prototype.onMouseMoveSlider = function(event) {
      event.preventDefault();
      return this.retrieveVolumeValue(event);
    };

    VolumeManager.prototype.onMouseUpSlider = function(event) {
      event.preventDefault();
      this.slidableZone.off("mousemove");
      return this.slidableZone.off("mouseup");
    };

    VolumeManager.prototype.onClickToggleMute = function(event) {
      event.preventDefault();
      return this.toggleMute();
    };

    VolumeManager.prototype.retrieveVolumeValue = function(event) {
      var handlePositionPercent, handlePositionPx;
      handlePositionPx = event.clientX - this.sliderContainer.offset().left;
      handlePositionPercent = handlePositionPx / this.sliderContainer.width() * 100;
      this.volumeValue = handlePositionPercent.toFixed(0);
      return this.controlVolumeValue();
    };

    VolumeManager.prototype.controlVolumeValue = function() {
      if (this.volumeValue > 100) {
        this.volumeValue = 100;
      }
      if (this.volumeValue < 0) {
        this.volumeValue = 0;
        if (!this.isMuted) {
          this.toggleMute();
        }
      }
      if (this.volumeValue > 0 && this.isMuted) {
        this.toggleMute();
      }
      return this.updateDisplay();
    };

    VolumeManager.prototype.updateDisplay = function() {
      var newWidth;
      Backbone.Mediator.publish('volumeManager:volumeChanged', this.volumeValue);
      newWidth = this.isMuted ? 0 : this.volumeValue;
      return this.sliderInner.width("" + newWidth + "%");
    };

    VolumeManager.prototype.toggleMute = function() {
      Backbone.Mediator.publish('volumeManager:toggleMute', this.volumeValue);
      if (this.isMuted) {
        this.volumeSwitch.removeClass("mute");
      } else {
        this.volumeSwitch.addClass("mute");
      }
      this.isMuted = !this.isMuted;
      return this.updateDisplay();
    };

    return VolumeManager;

  })(BaseView);
  
});
window.require.register("views/templates/home", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div id="content"><div id="uploader"></div><div id="off-screen-nav"></div><div id="tracks-display"></div><div id="player"></div></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/off_screen_nav", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="off-screen-nav-title">Content</div><ul><li>My Songs</li><li>Play Queue</li><li>ma liste de courses</li><li>quand je cours nu dans mon appart</li><li>jogging</li></ul>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/player/player", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="player-element"><div class="button rwd"></div><div class="button play loading"></div><div class="button fwd"></div></div><div class="player-element"><div class="progress-side"><div class="list-control loop"></div><div class="time left"><span id="elapsedTime"></span></div></div><div class="progress-info"><div class="id3-info">-</div><div class="progress"><div class="inner"></div></div></div><div class="progress-side"><div class="list-control random"></div><div class="time right"><span id="remainingTime"></span></div></div></div><div class="player-element"><span id="volume"></span></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/player/volumeManager", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="volume-switch"></div><div class="slider"><div class="slider-container"><div class="slider-inner"><div class="slider-handle"></div></div></div></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/tracklist", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="viewport"><table><thead><tr><th class="left"></th><th class="field title">Title</th><th class="field artist">Artist</th><th class="field album">Album</th><th class="field num">#</th><th class="right"></th></tr></thead><tbody id="track-list"></tbody></table></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/tracklist_item", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<td id="state" class="left"><div class="button addto"></div><div class="button puttoplay"></div></td><td class="field title">' + escape((interp = model.title) == null ? '' : interp) + '</td><td class="field artist">' + escape((interp = model.artist) == null ? '' : interp) + '</td><td class="field album">' + escape((interp = model.album) == null ? '' : interp) + '</td><td class="field num">' + escape((interp = model.track) == null ? '' : interp) + '</td><td class="right"><div class="button delete"></div></td>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/uploader", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<table><td id="h1">CoZic</td><td id="h2">Put music in your Cozy</td></table>');
  }
  return buf.join("");
  };
});
window.require.register("views/tracklist", function(exports, require, module) {
  var Track, TrackListView, TrackView, ViewCollection, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TrackView = require('./tracklist_item');

  Track = require('../models/track');

  ViewCollection = require('../lib/view_collection');

  module.exports = TrackListView = (function(_super) {
    __extends(TrackListView, _super);

    function TrackListView() {
      this.onUnclickTrack = __bind(this.onUnclickTrack, this);
      this.onClickTrack = __bind(this.onClickTrack, this);
      this.toggleSort = __bind(this.toggleSort, this);
      this.onClickTableHead = __bind(this.onClickTableHead, this);
      this.updateSortingDisplay = __bind(this.updateSortingDisplay, this);
      this.appendBlanckTrack = __bind(this.appendBlanckTrack, this);
      this.afterRender = __bind(this.afterRender, this);
      _ref = TrackListView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TrackListView.prototype.className = 'tracks-display';

    TrackListView.prototype.tagName = 'div';

    TrackListView.prototype.template = require('./templates/tracklist');

    TrackListView.prototype.itemview = TrackView;

    TrackListView.prototype.collectionEl = '#track-list';

    TrackListView.prototype.minTrackListLength = 40;

    TrackListView.prototype.events = {
      'click th.field.title': function(event) {
        return this.onClickTableHead(event, 'title');
      },
      'click th.field.artist': function(event) {
        return this.onClickTableHead(event, 'artist');
      },
      'click th.field.album': function(event) {
        return this.onClickTableHead(event, 'album');
      }
    };

    TrackListView.prototype.subscriptions = {
      'track:click': 'onClickTrack',
      'track:unclick': 'onUnclickTrack',
      'uploader:addTracks': function(e) {
        this.elementSort = null;
        this.isReverseOrder = false;
        this.updateSortingDisplay();
        return this.$('.viewport').scrollTop("0");
      },
      'uploader:addTrack': function(e) {
        this.$(".blank:last").remove();
        if (!this.$(".track:nth-child(2)").hasClass('odd')) {
          return this.$(".track:first").addClass('odd');
        }
      },
      'trackItem:remove': function(e) {
        if (this.collection.length <= this.minTrackListLength) {
          this.appendBlanckTrack();
          $('tr.blank:odd').addClass('odd');
          return $('tr.blank:even').removeClass('odd');
        }
      }
    };

    TrackListView.prototype.initialize = function() {
      TrackListView.__super__.initialize.apply(this, arguments);
      this.toggleSort('artist');
      this.elementSort = null;
      this.isReverseOrder = false;
      this.listenTo(this.collection, 'sort', this.render);
      return this.listenTo(this.collection, 'sync', function(e) {
        console.log("vue tracklist : \"pense à me supprimer un de ces quatres\"");
        if (this.collection.length === 0) {
          return Backbone.Mediator.publish('tracklist:isEmpty');
        }
      });
    };

    TrackListView.prototype.afterRender = function() {
      var i, _i, _ref1, _ref2;
      TrackListView.__super__.afterRender.apply(this, arguments);
      this.selectedTrackView = null;
      this.updateSortingDisplay();
      this.$('.viewport').niceScroll({
        cursorcolor: "#444",
        cursorborder: "",
        cursorwidth: "15px",
        cursorborderradius: "0px",
        horizrailenabled: "false",
        cursoropacitymin: "0.3",
        hidecursordelay: "700"
      });
      if (this.collection.length <= this.minTrackListLength) {
        for (i = _i = _ref1 = this.collection.length, _ref2 = this.minTrackListLength; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = _ref1 <= _ref2 ? ++_i : --_i) {
          this.appendBlanckTrack();
        }
      }
      return $('.tracks-display tr:odd').addClass('odd');
    };

    TrackListView.prototype.appendBlanckTrack = function() {
      var blankTrack;
      blankTrack = $(document.createElement('tr'));
      blankTrack.addClass("track blank");
      blankTrack.html("<td colspan=\"6\"></td>");
      return this.$collectionEl.append(blankTrack);
    };

    TrackListView.prototype.remove = function() {
      TrackListView.__super__.remove.apply(this, arguments);
      return this.$('.viewport').getNiceScroll().remove();
    };

    TrackListView.prototype.updateSortingDisplay = function() {
      var newArrow;
      this.$('.sortArrow').remove();
      if (this.elementSort != null) {
        newArrow = $(document.createElement('div'));
        if (this.isReverseOrder) {
          newArrow.addClass('sortArrow up');
        } else {
          newArrow.addClass('sortArrow down');
        }
        return this.$('th.field.' + this.elementSort).append(newArrow);
      }
    };

    TrackListView.prototype.onClickTableHead = function(event, element) {
      event.preventDefault();
      event.stopPropagation();
      return this.toggleSort(element);
    };

    TrackListView.prototype.toggleSort = function(element) {
      var compare, elementArray,
        _this = this;
      if (this.elementSort === element) {
        this.isReverseOrder = !this.isReverseOrder;
      } else {
        this.isReverseOrder = false;
      }
      this.elementSort = element;
      if (element === 'title') {
        elementArray = ['title', 'artist', 'album', 'track'];
      } else if (element === 'artist') {
        elementArray = ['artist', 'album', 'track', 'title'];
      } else if (element === 'album') {
        elementArray = ['album', 'track', 'title', 'artist'];
      } else {
        elementArray = [element, null, null, null];
      }
      compare = function(t1, t2) {
        var field1, field2, i, _i;
        for (i = _i = 0; _i <= 3; i = ++_i) {
          field1 = t1.get(elementArray[i]);
          field2 = t2.get(elementArray[i]);
          if (((field1.match(/^[0-9]+$/)) != null) && ((field2.match(/^[0-9]+$/)) != null)) {
            field1 = parseInt(field1);
            field2 = parseInt(field2);
          } else if (((field1.match(/^[0-9]+\/[0-9]+$/)) != null) && ((field2.match(/^[0-9]+\/[0-9]+$/)) != null)) {
            field1 = parseInt(field1.match(/^[0-9]+/));
            field2 = parseInt(field2.match(/^[0-9]+/));
          }
          if (field1 < field2) {
            return -1;
          }
          if (field1 > field2) {
            return 1;
          }
        }
        return 0;
      };
      if (this.isReverseOrder) {
        this.collection.comparator = function(t1, t2) {
          return compare(t2, t1);
        };
      } else {
        this.collection.comparator = function(t1, t2) {
          return compare(t1, t2);
        };
      }
      return this.collection.sort();
    };

    TrackListView.prototype.onClickTrack = function(trackView) {
      if (this.selectedTrackView !== null) {
        this.selectedTrackView.toggleSelect();
      }
      return this.selectedTrackView = trackView;
    };

    TrackListView.prototype.onUnclickTrack = function() {
      return this.selectedTrackView = null;
    };

    return TrackListView;

  })(ViewCollection);
  
});
window.require.register("views/tracklist_item", function(exports, require, module) {
  var BaseView, TrackListItemView, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  module.exports = TrackListItemView = (function(_super) {
    __extends(TrackListItemView, _super);

    function TrackListItemView() {
      this.returnToNormal = __bind(this.returnToNormal, this);
      this.onUploadProgressChange = __bind(this.onUploadProgressChange, this);
      this.onClick = __bind(this.onClick, this);
      this.onDeleteClick = __bind(this.onDeleteClick, this);
      _ref = TrackListItemView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TrackListItemView.prototype.className = 'track';

    TrackListItemView.prototype.tagName = 'tr';

    TrackListItemView.prototype.template = require('./templates/tracklist_item');

    TrackListItemView.prototype.events = {
      'click .button.delete': 'onDeleteClick',
      'click .button.puttoplay': function(e) {
        if (e.ctrlKey) {
          return this.onPlayDblClick(e);
        } else {
          return this.onPlayClick(e);
        }
      },
      'dblclick .button.puttoplay': function(event) {
        event.preventDefault();
        return event.stopPropagation();
      },
      'dblclick': 'onDblClick',
      'click': 'onClick'
    };

    TrackListItemView.prototype.initialize = function() {
      var _this = this;
      TrackListItemView.__super__.initialize.apply(this, arguments);
      this.listenTo(this.model, 'change:state', this.onStateChange);
      this.listenTo(this.model, 'change:title', function(event) {
        return _this.$('td.field.title').html(_this.model.attributes.title);
      });
      this.listenTo(this.model, 'change:artist', function(event) {
        return _this.$('td.field.artist').html(_this.model.attributes.artist);
      });
      this.listenTo(this.model, 'change:album', function(event) {
        return _this.$('td.field.album').html(_this.model.attributes.album);
      });
      return this.listenTo(this.model, 'change:track', function(event) {
        return _this.$('td.field.num').html(_this.model.attributes.track);
      });
    };

    TrackListItemView.prototype.afterRender = function() {
      var state;
      state = this.model.attributes.state;
      if (state === 'client') {
        return this.initUpload();
      } else if (state === 'uploadStart') {
        this.initUpload();
        return this.startUpload();
      }
    };

    TrackListItemView.prototype.onDeleteClick = function(event) {
      var id, state,
        _this = this;
      event.preventDefault();
      event.stopPropagation();
      state = this.model.attributes.state;
      if (state === 'uploadStart') {
        alert("Wait for upload to finish to delete this track");
        return;
      }
      if (state === 'client') {
        this.model.set({
          state: 'canceled'
        });
      }
      id = this.model.attributes.id;
      Backbone.Mediator.publish('track:stop', "sound-" + id);
      this.model.destroy({
        error: function() {
          return alert("Server error occured, track was not deleted.");
        }
      });
      return Backbone.Mediator.publish('trackItem:remove');
    };

    TrackListItemView.prototype.onDblClick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.model.attributes.state === 'server') {
        return Backbone.Mediator.publish('track:playImmediate', this.model);
      }
    };

    TrackListItemView.prototype.onPlayClick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.model.attributes.state === 'server') {
        return Backbone.Mediator.publish('track:queue', this.model);
      }
    };

    TrackListItemView.prototype.onPlayDblClick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.model.attributes.state === 'server') {
        return Backbone.Mediator.publish('track:pushNext', this.model);
      }
    };

    TrackListItemView.prototype.toggleSelect = function() {
      if (this.$el.hasClass('selected')) {
        Backbone.Mediator.publish('track:unclick', this);
      } else {
        Backbone.Mediator.publish('track:click', this);
      }
      return this.$el.toggleClass('selected');
    };

    TrackListItemView.prototype.onClick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return this.toggleSelect();
    };

    TrackListItemView.prototype.onUploadProgressChange = function(e) {
      var el, pct;
      if (e.lengthComputable) {
        pct = Math.floor((e.loaded / e.total) * 100);
        el = this.$('.uploadProgress');
        if (el != null) {
          el.before(el.clone(true)).remove();
          return this.$('.uploadProgress').html("" + pct + "%");
        }
      } else {
        return console.warn('Content Length not reported!');
      }
    };

    TrackListItemView.prototype.onStateChange = function() {
      if (this.model.attributes.state === 'client') {
        return this.initUpload();
      } else if (this.model.attributes.state === 'uploadStart') {
        return this.startUpload();
      } else if (this.model.attributes.state === 'uploadEnd') {
        return this.endUpload();
      }
    };

    TrackListItemView.prototype.initUpload = function() {
      var uploadProgress;
      this.saveAddBtn = this.$('.button.addto').detach();
      this.savePlayBtn = this.$('.button.puttoplay').detach();
      uploadProgress = $(document.createElement('div'));
      uploadProgress.addClass('uploadProgress');
      uploadProgress.html('INIT');
      return this.$('#state').append(uploadProgress);
    };

    TrackListItemView.prototype.startUpload = function() {
      this.$('.uploadProgress').html('0%');
      return this.listenTo(this.model, 'progress', this.onUploadProgressChange);
    };

    TrackListItemView.prototype.endUpload = function() {
      this.stopListening(this.model, 'progress');
      this.$('.uploadProgress').html('DONE');
      return this.$('.uploadProgress').delay(1000).fadeOut(1000, this.returnToNormal);
    };

    TrackListItemView.prototype.returnToNormal = function() {
      this.$('.uploadProgress').remove();
      this.$('#state').append(this.saveAddBtn);
      this.$('#state').append(this.savePlayBtn);
      return this.model.attributes.state = 'server';
    };

    return TrackListItemView;

  })(BaseView);
  
});
window.require.register("views/uploader", function(exports, require, module) {
  var BaseView, Track, Uploader, app, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  Track = require('../models/track');

  app = require('../../application');

  module.exports = Uploader = (function(_super) {
    var controlFile, readMetaData, refreshDisplay, upload, uploadWorker,
      _this = this;

    __extends(Uploader, _super);

    function Uploader() {
      this.handleFiles = __bind(this.handleFiles, this);
      this.onDragOver = __bind(this.onDragOver, this);
      this.onFilesDropped = __bind(this.onFilesDropped, this);
      this.onUploadFormChange = __bind(this.onUploadFormChange, this);
      this.setupHiddenFileInput = __bind(this.setupHiddenFileInput, this);
      _ref = Uploader.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Uploader.prototype.className = 'uploader';

    Uploader.prototype.tagName = 'div';

    Uploader.prototype.template = require('./templates/uploader');

    Uploader.prototype.events = {
      'click': 'onClick',
      'drop': 'onFilesDropped',
      'dragover': 'onDragOver',
      dragend: function(e) {
        return this.$el.removeClass('dragover');
      },
      dragenter: function(e) {
        return this.$el.addClass('dragover');
      },
      dragleave: function(e) {
        return this.$el.removeClass('dragover');
      }
    };

    Uploader.prototype.subscriptions = {
      'tracklist:isEmpty': 'onEmptyTrackList'
    };

    Uploader.prototype.afterRender = function() {
      return this.setupHiddenFileInput();
    };

    Uploader.prototype.onEmptyTrackList = function() {
      return this.$('td#h2').html("Drop files here or click to add tracks");
    };

    Uploader.prototype.setupHiddenFileInput = function() {
      if (this.hiddenFileInput) {
        document.body.removeChild(this.hiddenFileInput);
      }
      this.hiddenFileInput = document.createElement("input");
      this.hiddenFileInput.setAttribute("type", "file");
      this.hiddenFileInput.setAttribute("multiple", "multiple");
      this.hiddenFileInput.setAttribute("accept", "audio/*");
      this.hiddenFileInput.style.visibility = "hidden";
      this.hiddenFileInput.style.position = "absolute";
      this.hiddenFileInput.style.top = "0";
      this.hiddenFileInput.style.left = "0";
      this.hiddenFileInput.style.height = "0";
      this.hiddenFileInput.style.width = "0";
      document.body.appendChild(this.hiddenFileInput);
      return this.hiddenFileInput.addEventListener("change", this.onUploadFormChange);
    };

    Uploader.prototype.onUploadFormChange = function(event) {
      this.handleFiles(this.hiddenFileInput.files);
      return this.setupHiddenFileInput();
    };

    Uploader.prototype.onClick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return this.hiddenFileInput.click();
    };

    Uploader.prototype.onFilesDropped = function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.$el.removeClass('dragover');
      event.dataTransfer = event.originalEvent.dataTransfer;
      return this.handleFiles(event.dataTransfer.files);
    };

    Uploader.prototype.onDragOver = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return this.$el.addClass('dragover');
    };

    controlFile = function(track, cb) {
      var err;
      if (!track.file.type.match(/audio\/(mp3|mpeg)/)) {
        err = "unsupported " + track.file.type + " filetype";
      }
      return cb(err);
    };

    readMetaData = function(track, cb) {
      var reader, url;
      url = track.get('title');
      reader = new FileReader();
      reader.onload = function(event) {
        return ID3.loadTags(url, (function() {
          var tags;
          tags = ID3.getAllTags(url);
          track.set({
            title: tags.title != null ? tags.title : url,
            artist: tags.artist != null ? tags.artist : '',
            album: tags.album != null ? tags.album : '',
            track: tags.track != null ? tags.track : ''
          });
          return cb();
        }), {
          tags: ['title', 'artist', 'album', 'track'],
          dataReader: FileAPIReader(track.file)
        });
      };
      reader.readAsArrayBuffer(track.file);
      return reader.onabort = function(event) {
        return cb("unable to read metadata");
      };
    };

    upload = function(track, cb) {
      var formdata;
      formdata = new FormData();
      formdata.append('cid', track.cid);
      formdata.append('title', track.get('title'));
      formdata.append('artist', track.get('artist'));
      formdata.append('album', track.get('album'));
      formdata.append('track', track.get('track'));
      formdata.append('file', track.file);
      if (track.attributes.state === 'canceled') {
        return cb("upload canceled");
      }
      track.set({
        state: 'uploadStart'
      });
      track.sync('create', track, {
        processData: false,
        contentType: false,
        data: formdata,
        success: function(model) {
          track.set(model);
          return cb();
        },
        error: function() {
          return cb("upload failed");
        }
      });
      return false;
    };

    refreshDisplay = function(track, cb) {
      track.set({
        state: 'uploadEnd'
      });
      return cb();
    };

    uploadWorker = function(track, done) {
      return async.waterfall([
        function(cb) {
          return controlFile(track, cb);
        }, function(cb) {
          return readMetaData(track, cb);
        }, function(cb) {
          return upload(track, cb);
        }, function(cb) {
          return refreshDisplay(track, cb);
        }
      ], function(err) {
        if (err) {
          return done("" + (track.get('title')) + " not uploaded properly : " + err, track);
        } else {
          return done();
        }
      });
    };

    Uploader.prototype.uploadQueue = async.queue(uploadWorker, 3);

    Uploader.prototype.handleFiles = function(files) {
      var file, fileAttributes, track, _i, _len, _results,
        _this = this;
      Backbone.Mediator.publish('uploader:addTracks');
      _results = [];
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        fileAttributes = {};
        fileAttributes.title = file.name;
        track = new Track(fileAttributes);
        track.file = file;
        app.tracks.unshift(track, {
          sort: false
        });
        track.set({
          state: 'client'
        });
        Backbone.Mediator.publish('uploader:addTrack');
        _results.push(this.uploadQueue.push(track, function(err, track) {
          if (err) {
            console.log(err);
            return app.tracks.remove(track);
          }
        }));
      }
      return _results;
    };

    return Uploader;

  }).call(this, BaseView);
  
});
