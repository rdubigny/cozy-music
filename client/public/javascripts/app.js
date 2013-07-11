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
      var Router;
      Router = require('router');
      this.router = new Router();
      this.soundManager = soundManager;
      this.soundManager.setup({
        debugMode: true,
        preferFlash: false,
        useFlashBlock: true,
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
  var AppView, BaseView, InlinePlayer, Player, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  InlinePlayer = require('views/inlineplayer');

  Player = require('views/player/player');

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
      this.player = new Player();
      this.player.render();
      return this.$('#player').append(this.player.$el);
    };

    return AppView;

  })(BaseView);
  
});
window.require.register("views/inlineplayer", function(exports, require, module) {
  
  /*
  SoundManager 2 Demo: Play MP3 links "in-place"
  ----------------------------------------------

  http://schillmania.com/projects/soundmanager2/

  A simple demo making MP3s playable "inline"
  and easily styled/customizable via CSS.

  Requires SoundManager 2 Javascript API.
  */
  var InlinePlayer;

  module.exports = InlinePlayer = (function() {
    function InlinePlayer() {
      var isIE, pl, self, sm;
      self = this;
      pl = this;
      sm = soundManager;
      isIE = navigator.userAgent.match(/msie/i);
      this.playableClass = "inline-playable";
      this.excludeClass = "inline-exclude";
      this.links = [];
      this.sounds = [];
      this.soundsByURL = [];
      this.indexByURL = [];
      this.lastSound = null;
      this.soundCount = 0;
      this.config = {
        playNext: false,
        autoPlay: false
      };
      this.css = {
        sDefault: "sm2_link",
        sLoading: "sm2_loading",
        sPlaying: "sm2_playing",
        sPaused: "sm2_paused"
      };
      this.addEventHandler = (typeof window.addEventListener !== "undefined" ? function(o, evtName, evtHandler) {
        return o.addEventListener(evtName, evtHandler, false);
      } : function(o, evtName, evtHandler) {
        return o.attachEvent("on" + evtName, evtHandler);
      });
      this.removeEventHandler = (typeof window.removeEventListener !== "undefined" ? function(o, evtName, evtHandler) {
        return o.removeEventListener(evtName, evtHandler, false);
      } : function(o, evtName, evtHandler) {
        return o.detachEvent("on" + evtName, evtHandler);
      });
      this.classContains = function(o, cStr) {
        if (typeof o.className !== "undefined") {
          return o.className.match(new RegExp("(\\s|^)" + cStr + "(\\s|$)"));
        } else {
          return false;
        }
      };
      this.addClass = function(o, cStr) {
        if (!o || !cStr || self.classContains(o, cStr)) {
          return false;
        }
        return o.className = (o.className ? o.className + " " : "") + cStr;
      };
      this.removeClass = function(o, cStr) {
        if (!o || !cStr || !self.classContains(o, cStr)) {
          return false;
        }
        return o.className = o.className.replace(new RegExp("( " + cStr + ")|(" + cStr + ")", "g"), "");
      };
      this.getSoundByURL = function(sURL) {
        if (typeof self.soundsByURL[sURL] !== "undefined") {
          return self.soundsByURL[sURL];
        } else {
          return null;
        }
      };
      this.isChildOfNode = function(o, sNodeName) {
        if (!o || !o.parentNode) {
          return false;
        }
        sNodeName = sNodeName.toLowerCase();
        while (true) {
          o = o.parentNode;
          if (!(o && o.parentNode && o.nodeName.toLowerCase() !== sNodeName)) {
            break;
          }
        }
        if (o.nodeName.toLowerCase() === sNodeName) {
          return o;
        } else {
          return null;
        }
      };
      this.events = {
        play: function() {
          pl.removeClass(this._data.oLink, this._data.className);
          this._data.className = pl.css.sPlaying;
          return pl.addClass(this._data.oLink, this._data.className);
        },
        stop: function() {
          pl.removeClass(this._data.oLink, this._data.className);
          return this._data.className = "";
        },
        pause: function() {
          pl.removeClass(this._data.oLink, this._data.className);
          this._data.className = pl.css.sPaused;
          return pl.addClass(this._data.oLink, this._data.className);
        },
        resume: function() {
          pl.removeClass(this._data.oLink, this._data.className);
          this._data.className = pl.css.sPlaying;
          return pl.addClass(this._data.oLink, this._data.className);
        },
        finish: function() {
          var nextLink;
          pl.removeClass(this._data.oLink, this._data.className);
          this._data.className = "";
          if (pl.config.playNext) {
            nextLink = pl.indexByURL[this._data.oLink.href] + 1;
            if (nextLink < pl.links.length) {
              return pl.handleClick({
                target: pl.links[nextLink]
              });
            }
          }
        }
      };
      this.stopEvent = function(e) {
        if (typeof e !== "undefined" && typeof e.preventDefault !== "undefined") {
          e.preventDefault();
        } else {
          if (typeof event !== "undefined" && typeof event.returnValue !== "undefined") {
            event.returnValue = false;
          }
        }
        return false;
      };
      this.getTheDamnLink = (isIE ? function(e) {
        if (e && e.target) {
          return e.target;
        } else {
          return window.event.srcElement;
        }
      } : function(e) {
        return e.target;
      });
      this.handleClick = function(e) {
        var o, sURL, soundURL, thisSound;
        if (typeof e.button !== "undefined" && e.button > 1) {
          return true;
        }
        o = self.getTheDamnLink(e);
        if (o.nodeName.toLowerCase() !== "a") {
          o = self.isChildOfNode(o, "a");
          if (!o) {
            return true;
          }
        }
        sURL = o.getAttribute("href");
        if (!o.href || (!sm.canPlayLink(o) && !self.classContains(o, self.playableClass)) || self.classContains(o, self.excludeClass)) {
          return true;
        }
        soundURL = o.href;
        thisSound = self.getSoundByURL(soundURL);
        if (thisSound) {
          if (thisSound === self.lastSound) {
            thisSound.togglePause();
          } else {
            sm._writeDebug("sound different than last sound: " + self.lastSound.id);
            if (self.lastSound) {
              self.stopSound(self.lastSound);
            }
            thisSound.togglePause();
          }
        } else {
          if (self.lastSound) {
            self.stopSound(self.lastSound);
          }
          thisSound = sm.createSound({
            id: "inlineMP3Sound" + (self.soundCount++),
            url: soundURL,
            onplay: self.events.play,
            onstop: self.events.stop,
            onpause: self.events.pause,
            onresume: self.events.resume,
            onfinish: self.events.finish,
            type: o.type || null
          });
          thisSound._data = {
            oLink: o,
            className: self.css.sPlaying
          };
          self.soundsByURL[soundURL] = thisSound;
          self.sounds.push(thisSound);
          thisSound.play();
        }
        self.lastSound = thisSound;
        if (typeof e !== "undefined" && typeof e.preventDefault !== "undefined") {
          e.preventDefault();
        } else {
          event.returnValue = false;
        }
        return false;
      };
      this.stopSound = function(oSound) {
        soundManager.stop(oSound.id);
        return soundManager.unload(oSound.id);
      };
      this.init = function() {
        var foundItems, i, j, oLinks;
        sm._writeDebug("inlinePlayer.init()");
        oLinks = document.getElementsByTagName("a");
        foundItems = 0;
        i = 0;
        j = oLinks.length;
        while (i < j) {
          if ((sm.canPlayLink(oLinks[i]) || self.classContains(oLinks[i], self.playableClass)) && !self.classContains(oLinks[i], self.excludeClass)) {
            self.addClass(oLinks[i], self.css.sDefault);
            self.links[foundItems] = oLinks[i];
            self.indexByURL[oLinks[i].href] = foundItems;
            foundItems++;
          }
          i++;
        }
        if (foundItems > 0) {
          self.addEventHandler(document, "click", self.handleClick);
          if (self.config.autoPlay) {
            self.handleClick({
              target: self.links[0],
              preventDefault: function() {}
            });
          }
        }
        return sm._writeDebug("inlinePlayer.init(): Found " + foundItems + " relevant items.");
      };
      this.init();
    }

    return InlinePlayer;

  })();
  
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
      this.stopTrack = __bind(this.stopTrack, this);
      this.afterRender = __bind(this.afterRender, this);
      _ref = Player.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Player.prototype.className = "player";

    Player.prototype.tagName = "div";

    Player.prototype.template = require('../templates/player/player');

    Player.prototype.events = {
      "click .button.play": "onClickPlay"
    };

    Player.prototype.afterRender = function() {
      this.volumeManager = new VolumeManager();
      this.volumeManager.render();
      this.$el.append(this.volumeManager.$el);
      this.currentTrack = app.soundManager.createSound({
        id: "DaSound" + ((Math.random() * 1000).toFixed(0)),
        url: "music/COMA - Hoooooray.mp3",
        onfinish: this.stopTrack,
        onstop: this.stopTrack
      });
      this.isStopped = true;
      this.isPaused = false;
      this.isPlayable = soundManager.canPlayLink("music/COMA - Hoooooray.mp3");
      this.playButton = this.$(".button.play");
      return this.playButton.addClass("stopped");
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
      return this.isPaused = false;
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

    VolumeManager.prototype.afterRender = function() {
      this.volumeValue = 50;
      this.isMuted = false;
      this.slidableZone = $(document);
      this.volumeSwitch = this.$(".volume-switch");
      this.slider = this.$(".slider");
      this.sliderContainer = this.$(".slider-container");
      this.sliderFiller = this.$(".slider-filler");
      this.sliderFiller.width("" + this.volumeValue + "%");
      return this.sliderInfo = this.$(".slider-info");
    };

    VolumeManager.prototype.onMouseDownSlider = function(event) {
      event.preventDefault();
      this.setValue(event);
      this.slidableZone.mousemove(this.onMouseMoveSlider);
      return this.slidableZone.mouseup(this.onMouseUpSlider);
    };

    VolumeManager.prototype.onMouseMoveSlider = function(event) {
      event.preventDefault();
      return this.setValue(event);
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

    VolumeManager.prototype.setValue = function(event) {
      var handlePositionPercent, handlePositionPx;
      handlePositionPx = event.clientX - this.sliderContainer.offset().left;
      handlePositionPercent = handlePositionPx / this.sliderContainer.width() * 100;
      this.volumeValue = handlePositionPercent.toFixed(0);
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
      newWidth = this.isMuted ? 0 : this.volumeValue;
      this.sliderInfo.html("done : " + newWidth);
      return this.sliderFiller.width("" + newWidth + "%");
    };

    VolumeManager.prototype.toggleMute = function() {
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
  buf.push('<div id="content"><h1>CoZic</h1><h2>Put music in your Cozy</h2><ul class="graphic"><li><a href="music/Air France - Joris Delacroix.mp3">Joris</a></li><li><a href="music/COMA - Hoooooray.mp3">Coma</a></li><li><a href="music/Rone - Bye Bye Macadam.mp3">Rone</a></li></ul><div id="player"></div></div>');
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
  buf.push('<div class="button rwd"></div><div class="button play"></div><div class="button fwd"></div>');
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
  buf.push('<div class="volume-switch"></div><div class="slider"><div class="slider-container"><div class="slider-filler"><div class="slider-handle"></div></div></div></div><!--.slider-info info-->');
  }
  return buf.join("");
  };
});
