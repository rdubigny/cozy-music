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
      var Router, TrackCollection;
      Router = require('router');
      this.router = new Router();
      TrackCollection = require('collections/track');
      this.tracks = new TrackCollection();
      this.soundManager = soundManager;
      this.soundManager.setup({
        debugMode: true,
        debugFlash: true,
        preferFlash: false,
        useFlashBlock: true,
        flashPollingInterval: 500,
        html5PollingInterval: 500,
        url: "../swf/",
        flashVersion: 9
      });
      this.soundManager.onready(function() {
        return Backbone.history.start();
      });
      if (typeof Object.freeze === 'function') {
        return Object.freeze(this);
      }
    }
  };
  
});
window.require.register("collections/track", function(exports, require, module) {
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

    ViewCollection.prototype.itemViewOptions = function() {};

    ViewCollection.prototype.collectionEl = null;

    ViewCollection.prototype.onChange = function() {
      return this.$el.toggleClass('empty', _.size(this.views) === 0);
    };

    ViewCollection.prototype.appendView = function(view) {
      return this.$collectionEl.append(view.el);
    };

    ViewCollection.prototype.initialize = function() {
      var collectionEl;
      ViewCollection.__super__.initialize.apply(this, arguments);
      this.views = {};
      this.listenTo(this.collection, "reset", this.onReset);
      this.listenTo(this.collection, "add", this.addItem);
      this.listenTo(this.collection, "remove", this.removeItem);
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
      this.$collectionEl = $(this.collectionEl);
      _ref1 = this.views;
      for (id in _ref1) {
        view = _ref1[id];
        this.appendView(view.$el);
      }
      this.onReset(this.collection);
      return this.onChange(this.views);
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
      }, this.itemViewOptions(model));
      view = new this.itemview(options);
      this.views[model.cid] = view.render();
      this.appendView(view);
      return this.onChange(this.views);
    };

    ViewCollection.prototype.removeItem = function(model) {
      this.views[model.cid].remove();
      delete this.views[model.cid];
      return this.onChange(this.views);
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
  var AppView, BaseView, Player, TrackList, app, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  TrackList = require('./tracklist');

  Player = require('./player/player');

  app = require('application');

  module.exports = AppView = (function(_super) {
    __extends(AppView, _super);

    function AppView() {
      _ref = AppView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AppView.prototype.el = 'body.application';

    AppView.prototype.template = require('./templates/home');

    AppView.prototype.player = null;

    AppView.prototype.afterRender = function() {
      this.trackList = new TrackList({
        collection: app.tracks
      });
      this.$('#tracks-display').append(this.trackList.$el);
      this.trackList.render();
      this.player = new Player();
      this.$('#player').append(this.player.$el);
      return this.player.render();
    };

    return AppView;

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
      this.onToggleMute = __bind(this.onToggleMute, this);
      this.onVolumeChange = __bind(this.onVolumeChange, this);
      this.stopTrack = __bind(this.stopTrack, this);
      this.afterRender = __bind(this.afterRender, this);
      _ref = Player.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Player.prototype.className = "player";

    Player.prototype.tagName = "div";

    Player.prototype.template = require('../templates/player/player');

    Player.prototype.events = {
      "click .button.play": "onClickPlay",
      "mousedown .progress": "onMouseDownProgress"
    };

    Player.prototype.afterRender = function() {
      var initialVolume;
      initialVolume = 50;
      this.vent = _.extend({}, Backbone.Events);
      this.vent.bind("volumeHasChanged", this.onVolumeChange);
      this.vent.bind("muteHasBeenToggled", this.onToggleMute);
      this.volumeManager = new VolumeManager({
        initVol: initialVolume,
        vent: this.vent
      });
      this.volumeManager.render();
      this.$('#volume').append(this.volumeManager.$el);
      this.elapsedTime = this.$('#elapsedTime');
      this.remainingTime = this.$('#remainingTime');
      this.progress = this.$('.progress');
      this.progressInner = this.$('.progress .inner');
      this.currentTrack = app.soundManager.createSound({
        id: "DaSound" + ((Math.random() * 1000).toFixed(0)),
        url: "music/COMA - Hoooooray.mp3",
        volume: initialVolume,
        onfinish: this.stopTrack,
        onstop: this.stopTrack,
        whileplaying: this.updateProgressDisplay
      });
      this.progressInner.width("0%");
      this.elapsedTime.html("0:00");
      this.remainingTime.html(this.formatMs(this.currentTrack.durationEstimate));
      this.isStopped = true;
      this.isPaused = false;
      return this.playButton = this.$(".button.play");
    };

    Player.prototype.onClickPlay = function() {
      if (this.isStopped) {
        this.currentTrack.play();
        this.playButton.removeClass("stopped");
        return this.isStopped = false;
      } else if (this.isPaused) {
        this.currentTrack.play();
        this.playButton.removeClass("paused");
        return this.isPaused = false;
      } else if (!this.isPaused && !this.isStopped) {
        this.currentTrack.pause();
        this.playButton.addClass("paused");
        return this.isPaused = true;
      }
    };

    Player.prototype.stopTrack = function() {
      this.playButton.addClass("stopped");
      this.isStopped = true;
      this.playButton.removeClass("paused");
      this.isPaused = false;
      return this.updateProgressDisplay();
    };

    Player.prototype.onVolumeChange = function(volume) {
      return this.currentTrack.setVolume(volume);
    };

    Player.prototype.onToggleMute = function() {
      return this.currentTrack.toggleMute();
    };

    Player.prototype.formatMs = function(ms) {
      var s;
      s = Math.floor((ms / 1000) % 60);
      if (s < 10) {
        s = "0" + s;
      }
      return "" + (Math.floor(ms / 60000)) + ":" + s;
    };

    Player.prototype.updateProgressDisplay = function() {
      var newWidth, remainingTime;
      newWidth = this.currentTrack.position / this.currentTrack.durationEstimate * 100;
      this.progressInner.width("" + newWidth + "%");
      this.elapsedTime.html(this.formatMs(this.currentTrack.position));
      remainingTime = this.currentTrack.durationEstimate - this.currentTrack.position;
      return this.remainingTime.html(this.formatMs(remainingTime));
    };

    Player.prototype.onMouseDownProgress = function(event) {
      var handlePositionPx, percent;
      event.preventDefault();
      handlePositionPx = event.clientX - this.progress.offset().left;
      percent = handlePositionPx / this.progress.width();
      if (this.currentTrack.durationEstimate * percent < this.currentTrack.duration) {
        this.currentTrack.setPosition(this.currentTrack.durationEstimate * percent);
        return this.updateProgressDisplay();
      }
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
      this.vent = options.vent;
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
      this.vent.trigger("volumeHasChanged", this.volumeValue);
      newWidth = this.isMuted ? 0 : this.volumeValue;
      return this.sliderInner.width("" + newWidth + "%");
    };

    VolumeManager.prototype.toggleMute = function() {
      this.vent.trigger("muteHasBeenToggled");
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
  buf.push('<div id="content"><h1>CoZic</h1><h2>Put music in your Cozy</h2><div id="tracks-display"></div><div id="player"></div></div>');
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
  buf.push('<div class="button rwd"></div><div class="button play stopped"></div><div class="button fwd"></div><span id="volume"></span><div class="time left"><span id="elapsedTime"></span></div><div class="progress"><div class="inner"></div></div><div class="time right"><span id="remainingTime"></span></div>');
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
  buf.push('<input id="uploader" type="file"/><div id="track-list"></div>');
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
  buf.push('<div class="title">' + escape((interp = model.title) == null ? '' : interp) + '</div><button class="delete-button">delete</button>');
  }
  return buf.join("");
  };
});
window.require.register("views/tracklist", function(exports, require, module) {
  var BaseView, Track, TrackListView, TrackView, ViewCollection, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  TrackView = require('./tracklist_item');

  Track = require('../models/track');

  ViewCollection = require('../lib/view_collection');

  module.exports = TrackListView = (function(_super) {
    __extends(TrackListView, _super);

    function TrackListView() {
      this.upload = __bind(this.upload, this);
      this.addFile = __bind(this.addFile, this);
      _ref = TrackListView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TrackListView.prototype.className = 'tracks-display';

    TrackListView.prototype.template = require('./templates/tracklist');

    TrackListView.prototype.itemview = TrackView;

    TrackListView.prototype.collectionEl = '#track-list';

    TrackListView.prototype.events = {
      'change #uploader': 'addFile'
    };

    TrackListView.prototype.initialize = function() {
      TrackListView.__super__.initialize.apply(this, arguments);
      return this.views = {};
    };

    TrackListView.prototype.afterRender = function() {
      var _this = this;
      TrackListView.__super__.afterRender.apply(this, arguments);
      this.uploader = this.$('#uploader')[0];
      this.$collectionEl.html('<em>loading...</em>');
      return this.collection.fetch({
        success: function(collection, response, option) {
          return _this.$collectionEl.find('em').remove();
        },
        error: function() {
          var msg;
          msg = "Files couldn't be retrieved due to a server error.";
          return _this.$collectionEl.find('em').html(msg);
        }
      });
    };

    TrackListView.prototype.addFile = function() {
      var attach, fileAttributes, track;
      attach = this.uploader.files[0];
      fileAttributes = {};
      fileAttributes.title = attach.name;
      track = new Track(fileAttributes);
      track.file = attach;
      this.collection.add(track);
      return this.upload(track);
    };

    TrackListView.prototype.upload = function(track) {
      var formdata;
      formdata = new FormData();
      formdata.append('cid', track.cid);
      formdata.append('title', track.get('title'));
      formdata.append('file', track.file);
      return Backbone.sync('create', track, {
        contentType: false,
        data: formdata
      });
    };

    return TrackListView;

  })(ViewCollection);
  
});
window.require.register("views/tracklist_item", function(exports, require, module) {
  var BaseView, TrackListItemView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  module.exports = TrackListItemView = (function(_super) {
    __extends(TrackListItemView, _super);

    function TrackListItemView() {
      _ref = TrackListItemView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TrackListItemView.prototype.className = 'track';

    TrackListItemView.prototype.tagName = 'div';

    TrackListItemView.prototype.template = require('./templates/tracklist_item');

    TrackListItemView.prototype.events = {
      'click .delete-button': 'onDeleteClicked'
    };

    TrackListItemView.prototype.onDeleteClicked = function() {
      this.$('.delete-button').html("deleting...");
      return this.model.destroy({
        error: function() {
          alert("Server error occured, track was not deleted.");
          return this.$('.delete-button').html("delete");
        }
      });
    };

    return TrackListItemView;

  })(BaseView);
  
});
