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
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
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

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("application", function(exports, require, module) {
var Application,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

module.exports = Application = (function() {
  function Application() {
    this.launchTimer = __bind(this.launchTimer, this);
    this.resetTimer = __bind(this.resetTimer, this);
    this.onMute = __bind(this.onMute, this);
    this.onFinish = __bind(this.onFinish, this);
    this.playSong = __bind(this.playSong, this);
    this.getSongUrl = __bind(this.getSongUrl, this);
    this.initialize = __bind(this.initialize, this);
  }

  Application.prototype.defaultVolume = 100;

  Application.prototype.initialize = function() {
    var title,
      _this = this;
    title = document.URL;
    $('#title').html("<i class='icon-music'></i> " + (title.replace(/\/public\/cozic\/.*$/, '').replace(/^.*:\/\//, '')));
    $('#mute-button').click(function(event) {
      event.preventDefault();
      event.stopPropagation();
      return _this.onMute();
    });
    this.soundManager = soundManager;
    this.soundManager.setup({
      debugMode: false,
      debugFlash: false,
      useFlashBlock: false,
      preferFlash: true,
      url: "swf/",
      flashVersion: 9,
      onready: function() {
        $('#song-info').html("<i class='icon-cog'></i> Requesting server...");
        return _this.getSongUrl();
      },
      ontimeout: function() {
        return $('#song-info').html("<i class='icon-exclamation-sign'></i> unable to load player");
      }
    });
    this.volume = this.defaultVolume;
    this.prevSoundUrl = "";
    return this.resetTimer();
  };

  Application.prototype.getSongUrl = function() {
    var _this = this;
    console.log("asking server...");
    return $.ajax("broadcast", {
      type: 'GET',
      error: function(jqXHR, textStatus, errorThrown) {
        return $('#song-info').html("<i class='icon-exclamation-sign'></i> " + textStatus + ": " + errorThrown);
      },
      success: function(data, textStatus, jqXHR) {
        if (textStatus === "nocontent") {
          $('#song-info').html("<i class='icon-stop'></i> No song to play yet");
          return _this.launchTimer();
        } else {
          if (data.url !== _this.prevSoundUrl) {
            _this.playSong(data);
            return _this.resetTimer();
          } else {
            $('#song-info').html("<i class='icon-stop'></i> No more song to play for now");
            return _this.launchTimer();
          }
        }
      }
    });
  };

  Application.prototype.playSong = function(data) {
    this.prevSoundUrl = data.url;
    this.currentSound = this.soundManager.createSound({
      id: "sound",
      url: data.url,
      volume: this.volume,
      autoPlay: true,
      onfinish: this.onFinish
    });
    return $('#song-info').html("<i class='icon-play'></i>  " + data.title + " - <i>" + data.artist + "</i>");
  };

  Application.prototype.onFinish = function() {
    if (this.currentSound != null) {
      this.currentSound.destruct();
      this.currentSound = null;
    }
    $('#song-info').html("<i class='icon-stop'></i> Stopped");
    return this.getSongUrl();
  };

  Application.prototype.onMute = function() {
    if (this.currentSound != null) {
      if (this.volume === 0) {
        this.currentSound.setVolume(this.defaultVolume);
      } else {
        this.currentSound.setVolume(0);
      }
    }
    if (this.volume === 0) {
      this.volume = this.defaultVolume;
      return $('#mute-button').html("<i class='icon-volume-up'></i> mute");
    } else {
      this.volume = 0;
      return $('#mute-button').html("<i class='icon-volume-off'></i>&nbsp;&nbsp;unmute");
    }
  };

  Application.prototype.resetTimer = function() {
    return this.timeToWait = 1;
  };

  Application.prototype.launchTimer = function() {
    var _this = this;
    setTimeout(function() {
      return _this.getSongUrl();
    }, this.timeToWait * 1000);
    return this.timeToWait = this.timeToWait >= 32 ? 32 : this.timeToWait * 2;
  };

  return Application;

})();

});

;require.register("initialize", function(exports, require, module) {
var Application;

Application = require('application');

$(function() {
  var app;
  require('lib/app_helpers');
  app = new Application();
  return app.initialize();
});

});

;require.register("lib/app_helpers", function(exports, require, module) {
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

;
//# sourceMappingURL=app.js.map