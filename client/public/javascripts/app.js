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
module.exports = {
  initialize: function() {
    var PlayQueue, Router, TrackCollection,
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
    PlayQueue = require('collections/playqueue');
    this.playQueue = new PlayQueue();
    this.selectedPlaylist = null;
    this.isBroadcastEnabled = false;
    $.ajax("broadcast", {
      type: 'DELETE',
      error: function(jqXHR, textStatus, errorThrown) {
        return console.log("ajax fail : " + textStatus);
      }
    });
    this.soundManager = soundManager;
    this.soundManager.setup({
      debugMode: false,
      debugFlash: false,
      useFlashBlock: false,
      preferFlash: true,
      flashPollingInterval: 500,
      html5PollingInterval: 500,
      url: "swf/",
      flashVersion: 9,
      onready: function() {
        return $('.player').trigger('soundManager:ready');
      },
      ontimeout: function() {
        return $('.player').trigger('soundManager:timeout');
      }
    });
    return Backbone.history.start();
  }
};

});

;require.register("collections/playlist", function(exports, require, module) {
var PlaylistTrackCollection, Track, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Track = require('../models/track');

module.exports = PlaylistTrackCollection = (function(_super) {
  __extends(PlaylistTrackCollection, _super);

  function PlaylistTrackCollection() {
    this.add = __bind(this.add, this);
    this.getWeight = __bind(this.getWeight, this);
    _ref = PlaylistTrackCollection.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlaylistTrackCollection.prototype.model = Track;

  PlaylistTrackCollection.prototype.getWeight = function(playlists) {
    var elem, _i, _len;
    for (_i = 0, _len = playlists.length; _i < _len; _i++) {
      elem = playlists[_i];
      if (elem.id === this.playlistId) {
        return elem.weight;
      }
    }
    return false;
  };

  PlaylistTrackCollection.prototype.add = function(track, superOnly, options) {
    var last, lastWeight,
      _this = this;
    if (superOnly == null) {
      superOnly = false;
    }
    if (superOnly) {
      return PlaylistTrackCollection.__super__.add.call(this, track, options);
    }
    if (this.size() > 0) {
      last = this.last();
      lastWeight = this.getWeight(last.attributes.playlists);
    } else {
      lastWeight = 0;
    }
    track.sync('update', track, {
      url: "" + this.url + "/" + track.id + "/" + lastWeight,
      error: function(xhr) {
        var msg;
        msg = JSON.parse(xhr.responseText);
        return alert("fail to add track : " + msg.error);
      },
      success: function(playlists) {
        return track.attributes.playlists = playlists;
      }
    });
    return this.listenToOnce(track, 'sync', PlaylistTrackCollection.__super__.add.apply(this, arguments));
  };

  PlaylistTrackCollection.prototype.remove = function(track, superOnly) {
    if (superOnly == null) {
      superOnly = false;
    }
    if (superOnly) {
      return PlaylistTrackCollection.__super__.remove.call(this, track);
    }
    track.sync('delete', track, {
      url: "" + this.url + "/" + track.id,
      error: function(xhr) {
        var msg;
        msg = JSON.parse(xhr.responseText);
        return alert("fail to remove track : " + msg.error);
      }
    });
    return this.listenToOnce(track, 'sync', PlaylistTrackCollection.__super__.remove.apply(this, arguments));
  };

  PlaylistTrackCollection.prototype.move = function(newP, track) {
    var next, nextWeight, oldP, prev, prevWeight,
      _this = this;
    oldP = this.indexOf(track);
    if (newP === oldP) {
      return;
    }
    if (newP === 0) {
      prevWeight = 0;
    } else {
      prev = oldP < newP ? this.at(newP) : this.at(newP - 1);
      prevWeight = this.getWeight(prev.attributes.playlists);
    }
    if (newP >= this.indexOf(this.last())) {
      nextWeight = Math.pow(2, 53);
    } else {
      next = oldP < newP ? this.at(newP + 1) : this.at(newP);
      nextWeight = this.getWeight(next.attributes.playlists);
    }
    track.sync('update', track, {
      url: "" + this.url + "/prev/" + prevWeight + "/next/" + nextWeight + "/" + track.id,
      error: function(xhr) {
        var msg;
        msg = JSON.parse(xhr.responseText);
        return alert("fail to move track : " + msg.error);
      },
      success: function(playlists) {
        return track.attributes.playlists = playlists;
      }
    });
    this.remove(track, true);
    return this.add(track, true, {
      at: newP
    });
  };

  return PlaylistTrackCollection;

})(Backbone.Collection);

});

;require.register("collections/playlist_collection", function(exports, require, module) {
var Playlist, PlaylistCollection, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Playlist = require('../models/playlist');

module.exports = PlaylistCollection = (function(_super) {
  __extends(PlaylistCollection, _super);

  function PlaylistCollection() {
    _ref = PlaylistCollection.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlaylistCollection.prototype.model = Playlist;

  PlaylistCollection.prototype.url = 'playlists';

  return PlaylistCollection;

})(Backbone.Collection);

});

;require.register("collections/playqueue", function(exports, require, module) {
var PlayQueue, Track, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Track = require('../models/track');

module.exports = PlayQueue = (function(_super) {
  var viewHaveToBeSignaled;

  __extends(PlayQueue, _super);

  function PlayQueue() {
    this.setAtPlay = __bind(this.setAtPlay, this);
    _ref = PlayQueue.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlayQueue.prototype.atPlay = 0;

  PlayQueue.prototype.model = Track;

  PlayQueue.prototype.playLoop = 'no-repeat';

  viewHaveToBeSignaled = false;

  PlayQueue.prototype.setAtPlay = function(value, signalView) {
    if (signalView == null) {
      signalView = true;
    }
    this.atPlay = value;
    if (signalView) {
      return this.trigger('change:atPlay');
    } else {
      return this.viewHaveToBeSignaled = true;
    }
  };

  PlayQueue.prototype.getCurrentTrack = function() {
    var _ref1;
    if ((0 <= (_ref1 = this.atPlay) && _ref1 < this.length)) {
      return this.at(this.atPlay);
    } else {
      return null;
    }
  };

  PlayQueue.prototype.getNextTrack = function() {
    if (this.playLoop === 'repeat-one') {
      return this.at(this.atPlay);
    } else if (this.atPlay < this.length - 1) {
      this.setAtPlay(this.atPlay + 1);
      return this.at(this.atPlay);
    } else if (this.playLoop === 'repeat-all' && this.length > 0) {
      this.setAtPlay(0);
      return this.at(this.atPlay);
    } else {
      return null;
    }
  };

  PlayQueue.prototype.getPrevTrack = function() {
    if (this.playLoop === 'repeat-one') {
      return this.at(this.atPlay);
    } else if (this.atPlay > 0) {
      this.setAtPlay(this.atPlay - 1);
      return this.at(this.atPlay);
    } else if (this.playLoop === 'repeat-all' && this.length > 0) {
      this.setAtPlay(this.length - 1);
      return this.at(this.atPlay);
    } else {
      return null;
    }
  };

  PlayQueue.prototype.queue = function(track) {
    if (!this.get(track.id)) {
      return this.push(track, {
        sort: false
      });
    } else {
      return this.moveItem(track, this.size() - 1);
    }
  };

  PlayQueue.prototype.pushNext = function(track) {
    if (!this.get(track.id)) {
      if (this.length > 0) {
        return this.add(track, {
          at: this.atPlay + 1
        });
      } else {
        return this.add(track);
      }
    } else {
      if (this.indexOf(track) < this.atPlay) {
        return this.moveItem(track, this.atPlay);
      } else {
        return this.moveItem(track, this.atPlay + 1);
      }
    }
  };

  PlayQueue.prototype.moveItem = function(track, position) {
    if (this.indexOf(track) === this.atPlay) {
      this.setAtPlay(position);
    } else {
      if (this.indexOf(track) < this.atPlay) {
        this.setAtPlay(this.atPlay - 1);
      }
      if (position <= this.atPlay) {
        this.setAtPlay(this.atPlay + 1);
      }
    }
    this.remove(track, false);
    return this.add(track, {
      at: position
    });
  };

  PlayQueue.prototype.remove = function(track, updateAtPlayValue) {
    var id;
    if (updateAtPlayValue == null) {
      updateAtPlayValue = true;
    }
    if (updateAtPlayValue) {
      if (this.indexOf(track) < this.atPlay) {
        this.setAtPlay(this.atPlay - 1, false);
      } else if (this.indexOf(track) === this.atPlay) {
        id = track.get('id');
        Backbone.Mediator.publish('track:delete', "sound-" + id);
        if (this.indexOf(track) === this.indexOf(this.last()) && this.length > 1) {
          this.setAtPlay(this.atPlay - 1, false);
        }
      }
    }
    PlayQueue.__super__.remove.call(this, track);
    if (this.viewHaveToBeSignaled) {
      this.trigger('change:atPlay');
      return this.viewHaveToBeSignaled = false;
    }
  };

  PlayQueue.prototype.playFromTrack = function(track) {
    var index;
    index = this.indexOf(track);
    this.setAtPlay(index);
    return Backbone.Mediator.publish('track:play-from', track);
  };

  PlayQueue.prototype.deleteFromIndexToEnd = function(index) {
    var _results;
    _results = [];
    while (this.indexOf(this.last()) >= index) {
      _results.push(this.remove(this.last()));
    }
    return _results;
  };

  PlayQueue.prototype.deleteFromBeginingToIndex = function(index) {
    var count, i, _i, _results;
    count = index < this.length ? index : this.length;
    _results = [];
    for (i = _i = 0; 0 <= count ? _i <= count : _i >= count; i = 0 <= count ? ++_i : --_i) {
      _results.push(this.remove(this.first()));
    }
    return _results;
  };

  PlayQueue.prototype.randomize = function() {
    var i, tmp, _i, _j, _ref1, _ref2, _ref3, _results;
    if (this.atPlay < this.length - 1) {
      tmp = new Backbone.Collection();
      for (i = _i = _ref1 = this.atPlay + 1, _ref2 = this.length - 1; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = _ref1 <= _ref2 ? ++_i : --_i) {
        tmp.push(this.models[i]);
      }
      tmp.reset(tmp.shuffle());
      while (this.indexOf(this.last()) > this.atPlay) {
        this.remove(this.last());
      }
      _results = [];
      for (i = _j = 0, _ref3 = tmp.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
        _results.push(this.push(tmp.models[i]));
      }
      return _results;
    }
  };

  PlayQueue.prototype.show = function() {
    var curM, i, _i, _ref1, _results;
    console.log("atPlay : " + this.atPlay);
    console.log("PlayQueue content :");
    if (this.length >= 1) {
      _results = [];
      for (i = _i = 0, _ref1 = this.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        curM = this.models[i];
        _results.push(console.log(this.indexOf(curM) + ") " + curM.attributes.title));
      }
      return _results;
    }
  };

  return PlayQueue;

})(Backbone.Collection);

});

;require.register("collections/track_collection", function(exports, require, module) {
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

;require.register("initialize", function(exports, require, module) {
var app;

app = require('application');

$(function() {
  require('lib/app_helpers');
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

;require.register("lib/base_view", function(exports, require, module) {
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

;require.register("lib/view_collection", function(exports, require, module) {
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
    this.views = {};
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

;require.register("models/playlist", function(exports, require, module) {
var Playlist, PlaylistTrackCollection, app, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

PlaylistTrackCollection = require('../collections/playlist');

app = require('application');

module.exports = Playlist = (function(_super) {
  __extends(Playlist, _super);

  function Playlist() {
    _ref = Playlist.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Playlist.prototype.urlRoot = "playlists";

  Playlist.prototype.initialize = function() {
    var _this = this;
    Playlist.__super__.initialize.apply(this, arguments);
    this.listenTo(this, 'change:id', function(e) {
      _this.tracks.playlistId = "" + _this.id;
      return _this.tracks.url = "playlists/" + _this.id;
    });
    this.tracks = new PlaylistTrackCollection(false, {
      url: "playlists/" + this.id
    });
    this.tracks.playlistId = "" + this.id;
    if (this.id != null) {
      return this.tracks.fetch();
    } else {
      return this.listenToOnce(this, 'sync', function(e) {
        return _this.tracks.fetch();
      });
    }
  };

  Playlist.prototype.destroy = function() {
    var curUrl, regex, str, track;
    curUrl = "" + document.URL;
    str = "#playlist/" + this.id;
    regex = new RegExp(str);
    if (curUrl.match(regex)) {
      app.router.navigate('', true);
    }
    while (this.tracks.length !== 0) {
      track = this.tracks.first();
      this.tracks.remove(track);
    }
    Playlist.__super__.destroy.apply(this, arguments);
    return false;
  };

  return Playlist;

})(Backbone.Model);

});

;require.register("models/track", function(exports, require, module) {
var Track, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = Track = (function(_super) {
  __extends(Track, _super);

  function Track() {
    _ref = Track.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Track.prototype.urlRoot = 'tracks';

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

;require.register("models/uploader", function(exports, require, module) {
var Track, Uploader, app, controlFile, readMetaData, refreshDisplay, upload, uploadWorker,
  _this = this;

app = require('application');

Track = require('models/track');

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
      var tags, _ref;
      tags = ID3.getAllTags(url);
      track.set({
        title: tags.title != null ? tags.title : url,
        artist: tags.artist != null ? tags.artist : '',
        album: tags.album != null ? tags.album : '',
        track: tags.track != null ? tags.track : '',
        year: tags.year != null ? tags.year : '',
        genre: tags.genre != null ? tags.genre : '',
        time: ((_ref = tags.TLEN) != null ? _ref.data : void 0) != null ? tags.TLEN.data : ''
      });
      return cb();
    }), {
      tags: ["title", "artist", "album", "track", "year", "genre", "TLEN"],
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
  formdata.append('year', track.get('year'));
  formdata.append('genre', track.get('genre'));
  formdata.append('time', track.get('time'));
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

Uploader = (function() {
  function Uploader() {}

  Uploader.prototype.uploadQueue = async.queue(uploadWorker, 3);

  Uploader.prototype.process = function(files) {
    var file, fileAttributes, track, _i, _len, _results,
      _this = this;
    Backbone.Mediator.publish('uploader:addTracks');
    _results = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      fileAttributes = {};
      fileAttributes = {
        title: file.name,
        artist: "",
        album: ""
      };
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

  Uploader.prototype.processYoutube = function(youId) {
    var fileAttributes, track,
      _this = this;
    fileAttributes = {};
    fileAttributes = {
      title: "fetching youtube-mp3.org ...",
      artist: "",
      album: ""
    };
    track = new Track(fileAttributes);
    app.tracks.unshift(track, {
      sort: false
    });
    track.set({
      state: 'importBegin'
    });
    Backbone.Mediator.publish('uploader:addTrack');
    return Backbone.ajax({
      dataType: "json",
      url: "you/" + youId,
      context: this,
      data: "",
      success: function(model) {
        track.set(model);
        return track.set({
          state: 'uploadEnd'
        });
      },
      error: function(xhr, status, error) {
        var beg, end;
        app.tracks.remove(track);
        beg = "Youtube import " + status;
        end = "Import was cancelled.";
        if (xhr.responseText !== "") {
          return alert("" + beg + " : " + xhr.responseText + ". " + end);
        } else {
          return alert("" + beg + ". " + end);
        }
      }
    });
  };

  return Uploader;

})();

module.exports = new Uploader();

});

;require.register("router", function(exports, require, module) {
var AppView, Router, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

AppView = require('views/app_view');

module.exports = Router = (function(_super) {
  __extends(Router, _super);

  function Router() {
    this.onVKey = __bind(this.onVKey, this);
    _ref = Router.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Router.prototype.routes = {
    '': 'main',
    'playqueue': 'playqueue',
    'playlist/:playlistId': 'playlist'
  };

  Router.prototype.initialize = function() {
    this.mainView = new AppView();
    this.mainView.render();
    this.lastSeen = null;
    this.atHome = false;
    return Mousetrap.bind('v', this.onVKey);
  };

  Router.prototype.onVKey = function() {
    if (this.atHome) {
      if (this.lastSeen != null) {
        return this.navigate("playlist/" + this.lastSeen, true);
      } else {
        return this.navigate("playqueue", true);
      }
    } else {
      return this.navigate("", true);
    }
  };

  Router.prototype.main = function() {
    this.atHome = true;
    return this.mainView.showTrackList();
  };

  Router.prototype.playlist = function(id) {
    this.atHome = false;
    this.lastSeen = id;
    return this.mainView.showPlayList(id);
  };

  Router.prototype.playqueue = function() {
    this.atHome = false;
    this.lastSeen = null;
    return this.mainView.showPlayQueue();
  };

  return Router;

})(Backbone.Router);

});

;require.register("views/app_view", function(exports, require, module) {
var AppView, BaseView, OffScreenNav, PlayQueue, Player, Playlist, PlaylistCollection, TopNav, Tracks, app, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

TopNav = require('views/top_nav');

Tracks = require('views/lists/tracks');

PlayQueue = require('views/lists/playqueue');

Playlist = require('views/lists/playlist');

Player = require('views/player/player');

OffScreenNav = require('views/off_screen_nav');

app = require('application');

PlaylistCollection = require('collections/playlist_collection');

module.exports = AppView = (function(_super) {
  __extends(AppView, _super);

  function AppView() {
    this.showPlayList = __bind(this.showPlayList, this);
    this.showPlayQueue = __bind(this.showPlayQueue, this);
    this.showTrackList = __bind(this.showTrackList, this);
    _ref = AppView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  AppView.prototype.el = 'body.application';

  AppView.prototype.template = require('views/templates/home');

  AppView.prototype.events = {
    'drop #content': function(e) {
      var _ref1;
      if (((_ref1 = e.originalEvent) != null ? _ref1.dataTransfer : void 0) == null) {
        return;
      }
      return this.topNav.onFilesDropped(e);
    },
    'dragover': function(e) {
      return this.topNav.onDragOver(e);
    },
    'mouseover': function(e) {
      return this.topNav.onDragOut(e);
    }
  };

  AppView.prototype.initialize = function() {
    AppView.__super__.initialize.apply(this, arguments);
    Cookies.defaults = {
      expires: 604800
    };
    this.playList = {};
    return this.currentPlaylistId = 0;
  };

  AppView.prototype.afterRender = function() {
    var _this = this;
    AppView.__super__.afterRender.apply(this, arguments);
    this.topNav = new TopNav;
    this.$('#top-nav').append(this.topNav.$el);
    this.topNav.render();
    this.player = new Player();
    this.$('#player').append(this.player.$el);
    this.player.render();
    this.playlistCollection = new PlaylistCollection();
    this.playlistCollection.fetch({
      success: function(collection) {
        _this.offScreenNav = new OffScreenNav({
          collection: collection
        });
        _this.$('#off-screen-nav').append(_this.offScreenNav.$el);
        return _this.offScreenNav.render();
      },
      error: function() {
        var msg;
        msg = "Playlists couldn't be retrieved due to a server error.";
        return alert(msg);
      }
    });
    return window.onbeforeunload = function() {
      var msg;
      msg = "";
      app.tracks.each(function(track) {
        var state;
        state = track.attributes.state;
        if (msg === "" && state !== 'server') {
          return msg += "upload will be cancelled ";
        }
      });
      if (!_this.player.isStopped && !_this.player.isPaused) {
        msg += "music will be stopped";
      }
      if (msg !== "" && app.playQueue.length > 0) {
        msg += " & your queue list will be erased.";
      }
      if (msg !== "") {
        return msg;
      } else {

      }
    };
  };

  AppView.prototype.showTrackList = function() {
    var _ref1;
    if (this.queueList != null) {
      this.queueList.beforeDetach();
      this.queueList.$el.detach();
    }
    if (this.playList[this.currentPlaylistId] != null) {
      this.playList[this.currentPlaylistId].beforeDetach();
      this.playList[this.currentPlaylistId].$el.detach();
    }
    if (this.tracklist == null) {
      this.tracklist = new Tracks({
        collection: app.tracks
      });
    }
    this.$('#tracks-display').append(this.tracklist.$el);
    this.tracklist.render();
    if (!$('#top-nav-title-home').hasClass('activated')) {
      $('#top-nav-title-home').addClass('activated');
    }
    $('#top-nav-title-list').removeClass('activated');
    return (_ref1 = this.offScreenNav) != null ? _ref1.$('li.activated').removeClass('activated') : void 0;
  };

  AppView.prototype.showPlayQueue = function() {
    var _ref1;
    if (this.tracklist != null) {
      this.tracklist.beforeDetach();
      this.tracklist.$el.detach();
    }
    if (this.playList[this.currentPlaylistId] != null) {
      this.playList[this.currentPlaylistId].beforeDetach();
      this.playList[this.currentPlaylistId].$el.detach();
    }
    if (this.queueList == null) {
      this.queueList = new PlayQueue({
        collection: app.playQueue
      });
    }
    this.$('#tracks-display').append(this.queueList.$el);
    this.queueList.render();
    if (!$('#top-nav-title-list').hasClass('activated')) {
      $('#top-nav-title-list').addClass('activated');
    }
    $('#top-nav-title-home').removeClass('activated');
    return (_ref1 = this.offScreenNav) != null ? _ref1.$('li.activated').removeClass('activated') : void 0;
  };

  AppView.prototype.showPlayList = function(id) {
    var playlistModel, _ref1;
    if (this.tracklist != null) {
      this.tracklist.beforeDetach();
      this.tracklist.$el.detach();
    }
    if (this.queueList != null) {
      this.queueList.beforeDetach();
      this.queueList.$el.detach();
    }
    if (this.playList[this.currentPlaylistId] != null) {
      this.playList[this.currentPlaylistId].beforeDetach();
      this.playList[this.currentPlaylistId].$el.detach();
    }
    this.currentPlaylistId = id;
    if ((_ref1 = this.offScreenNav) != null) {
      _ref1.$('li.activated').removeClass('activated');
    }
    playlistModel = this.playlistCollection.get(id);
    if (playlistModel != null) {
      this.appendPlaylist(playlistModel);
    } else {
      this.listenToOnce(this.playlistCollection, 'sync', function(collection) {
        playlistModel = collection.get(id);
        if (playlistModel != null) {
          return this.appendPlaylist(playlistModel);
        } else {
          alert('unable to get this playlist');
          if (app.router.lastSeen === id) {
            app.router.lastSeen = null;
          }
          return app.router.navigate('', true);
        }
      });
    }
    $('#top-nav-title-list').removeClass('activated');
    return $('#top-nav-title-home').removeClass('activated');
  };

  AppView.prototype.appendPlaylist = function(playlistModel) {
    var cid;
    if (this.playList[this.currentPlaylistId] == null) {
      this.playList[this.currentPlaylistId] = new Playlist({
        collection: playlistModel.tracks
      });
    }
    this.$('#tracks-display').append(this.playList[this.currentPlaylistId].$el);
    this.playList[this.currentPlaylistId].render();
    cid = playlistModel.cid;
    return this.offScreenNav.views[cid].$('li').addClass('activated');
  };

  return AppView;

})(BaseView);

});

;require.register("views/lists/playlist", function(exports, require, module) {

/*
    Inherited from playqueue (for the drag and drop feature)

    Features :
    - queue the entire list
    - list backed up on server side
*/
var BaseView, PlayListView, PlayQueueView, TrackView, Tracklist, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Tracklist = require('views/lists/tracklist');

PlayQueueView = require('views/lists/playqueue');

BaseView = require('lib/base_view');

TrackView = require('views/lists/playlist_item');

module.exports = PlayListView = (function(_super) {
  __extends(PlayListView, _super);

  function PlayListView() {
    _ref = PlayListView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlayListView.prototype.template = require('views/templates/playlist');

  PlayListView.prototype.itemview = TrackView;

  PlayListView.prototype.events = {
    'update-sort': 'updateSort',
    'click #playlist-play': 'onClickPlay',
    'remove-item': function(e, track) {
      return this.collection.remove(track);
    }
  };

  PlayListView.prototype.onClickPlay = function(event) {
    var app, filteredCollection;
    event.preventDefault();
    event.stopPropagation();
    app = require('application');
    app.playQueue.deleteFromIndexToEnd(0);
    filteredCollection = this.collection.filter(function(track) {
      return track.attributes.state === 'server';
    });
    Backbone.Mediator.publish('tracks:queue', filteredCollection);
    return app.router.navigate("playqueue", true);
  };

  PlayListView.prototype.updateSort = function(event, track, newPosition) {
    return this.collection.move(newPosition, track);
  };

  return PlayListView;

})(PlayQueueView);

});

;require.register("views/lists/playlist_item", function(exports, require, module) {
var PlayListItemView, TrackListItemView, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TrackListItemView = require('views/lists/tracklist_item');

module.exports = PlayListItemView = (function(_super) {
  __extends(PlayListItemView, _super);

  function PlayListItemView() {
    _ref = PlayListItemView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlayListItemView.prototype.events = {
    'click #delete-button': 'onDeleteClick',
    'drop': 'drop'
  };

  PlayListItemView.prototype.initialize = function() {
    var _this = this;
    PlayListItemView.__super__.initialize.apply(this, arguments);
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

  PlayListItemView.prototype.onDeleteClick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return this.$el.trigger('remove-item', this.model);
  };

  PlayListItemView.prototype.drop = function(event, index) {
    return this.$el.trigger('update-sort', [this.model, index]);
  };

  return PlayListItemView;

})(TrackListItemView);

});

;require.register("views/lists/playqueue", function(exports, require, module) {

/*
    Inherited from tracklist

    Features :
    - drag and drop
    - remove tracks from list
    - maintain a pointer on the track at play
*/
var PlayQueueView, TrackListView, TrackView, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TrackView = require('views/lists/playqueue_item');

TrackListView = require('views/lists/tracklist');

module.exports = PlayQueueView = (function(_super) {
  __extends(PlayQueueView, _super);

  function PlayQueueView() {
    this.onClickShowPrevious = __bind(this.onClickShowPrevious, this);
    this.afterRender = __bind(this.afterRender, this);
    _ref = PlayQueueView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlayQueueView.prototype.itemview = TrackView;

  PlayQueueView.prototype.template = require('views/templates/playqueue');

  PlayQueueView.prototype.events = {
    'update-sort': 'updateSort',
    'remove-item': function(e, track) {
      return this.collection.remove(track);
    },
    'play-from-track': 'playFromTrack',
    'remove-from-track': 'removeFromTrack',
    'remove-to-track': 'removeToTrack',
    'click .save-button': function(e) {
      return alert('not available yet');
    },
    'click .show-prev-button': 'onClickShowPrevious',
    'click .clear': 'removeFromFirst'
  };

  PlayQueueView.prototype.showPrevious = false;

  PlayQueueView.prototype.initialize = function() {
    var cookie,
      _this = this;
    PlayQueueView.__super__.initialize.apply(this, arguments);
    cookie = Cookies('isShowPreviousByDefault');
    this.showPrevious = (cookie != null) && cookie === "true";
    this.listenTo(this.collection, 'change:atPlay', function() {
      if (_this.isRendered) {
        return _this.render();
      }
    });
    return this.isRendered = false;
  };

  PlayQueueView.prototype.updateStatusDisplay = function() {
    var id, index, view, _ref1, _results;
    _ref1 = this.views;
    _results = [];
    for (id in _ref1) {
      view = _ref1[id];
      index = this.collection.indexOf(view.model);
      if (index < this.collection.atPlay) {
        if (this.showPrevious) {
          _results.push(view.$el.addClass('already-played'));
        } else {
          _results.push(view.$el.addClass('hidden'));
        }
      } else if (index === this.collection.atPlay) {
        _results.push(view.$el.addClass('at-play'));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  PlayQueueView.prototype.afterRender = function() {
    PlayQueueView.__super__.afterRender.apply(this, arguments);
    $('.tracks-display tr:odd').addClass('odd');
    this.updateStatusDisplay();
    this.$('#track-list').sortable({
      opacity: 0.8,
      delay: 150,
      containment: "parent",
      axis: "y",
      placeholder: "track sortable-placeholder",
      helper: function(e, tr) {
        var $helper, $originals;
        $originals = tr.children();
        $helper = tr.clone();
        $helper.children().each(function(index) {
          return $(this).width($originals.eq(index).width());
        });
        return $helper;
      },
      stop: function(event, ui) {
        var _ref1;
        if (((_ref1 = event.originalEvent) != null ? _ref1.dataTransfer : void 0) != null) {
          return;
        }
        return ui.item.trigger('drop', ui.item.index());
      }
    });
    return this.isRendered = true;
  };

  PlayQueueView.prototype.beforeRender = function() {
    if (this.isRendered) {
      this.$('#track-list').sortable("destroy");
    }
    PlayQueueView.__super__.beforeRender.apply(this, arguments);
    return this.isRendered = false;
  };

  PlayQueueView.prototype.beforeDetach = function() {
    if (this.isRendered) {
      this.$('#track-list').sortable("destroy");
    }
    PlayQueueView.__super__.beforeDetach.apply(this, arguments);
    return this.isRendered = false;
  };

  PlayQueueView.prototype.remove = function() {
    this.$('#track-list').sortable("destroy");
    PlayQueueView.__super__.remove.apply(this, arguments);
    return this.isRendered = false;
  };

  PlayQueueView.prototype.disableSort = function() {
    if (this.isRendered) {
      return this.$("#track-list").sortable("disable");
    }
  };

  PlayQueueView.prototype.enableSort = function() {
    if (this.isRendered) {
      return this.$("#track-list").sortable("enable");
    }
  };

  PlayQueueView.prototype.updateSort = function(event, track, position) {
    this.collection.moveItem(track, position);
    return this.render();
  };

  PlayQueueView.prototype.playFromTrack = function(event, track) {
    return this.collection.playFromTrack(track);
  };

  PlayQueueView.prototype.removeFromTrack = function(event, track) {
    var index;
    index = this.collection.indexOf(track);
    this.collection.deleteFromIndexToEnd(index);
    return this.render();
  };

  PlayQueueView.prototype.removeToTrack = function(event, track) {
    var index;
    index = this.collection.indexOf(track);
    this.collection.deleteFromBeginingToIndex(index);
    return this.render();
  };

  PlayQueueView.prototype.removeFromFirst = function(event) {
    this.collection.deleteFromIndexToEnd(0);
    return this.render();
  };

  PlayQueueView.prototype.onClickShowPrevious = function(e) {
    this.showPrevious = !this.showPrevious;
    Cookies.set('isShowPreviousByDefault', this.showPrevious);
    return this.render();
  };

  return PlayQueueView;

})(TrackListView);

});

;require.register("views/lists/playqueue_item", function(exports, require, module) {
var PlayQueueItemView, TrackListItemView, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TrackListItemView = require('views/lists/tracklist_item');

module.exports = PlayQueueItemView = (function(_super) {
  __extends(PlayQueueItemView, _super);

  function PlayQueueItemView() {
    this.onDeleteClick = __bind(this.onDeleteClick, this);
    this.onPlayClick = __bind(this.onPlayClick, this);
    _ref = PlayQueueItemView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlayQueueItemView.prototype.template = require('views/templates/playqueue_item');

  PlayQueueItemView.prototype.events = {
    'click #mini-play-button': 'onPlayClick',
    'click #delete-button': 'onDeleteClick',
    'click #delete-from-here-button': function(e) {
      if (e.ctrlKey || e.metaKey) {
        return this.onDeleteToHereClick(e);
      } else {
        return this.onDeleteFromHereClick(e);
      }
    },
    'drop': 'drop'
  };

  PlayQueueItemView.prototype.initialize = function() {
    var _this = this;
    PlayQueueItemView.__super__.initialize.apply(this, arguments);
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

  PlayQueueItemView.prototype.onPlayClick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return this.$el.trigger('play-from-track', this.model);
  };

  PlayQueueItemView.prototype.onDeleteClick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return this.$el.trigger('remove-item', this.model);
  };

  PlayQueueItemView.prototype.onDeleteFromHereClick = function(event) {
    return this.$el.trigger('remove-from-track', this.model);
  };

  PlayQueueItemView.prototype.onDeleteToHereClick = function(event) {
    return this.$el.trigger('remove-to-track', this.model);
  };

  PlayQueueItemView.prototype.drop = function(event, index) {
    return this.$el.trigger('update-sort', [this.model, index]);
  };

  return PlayQueueItemView;

})(TrackListItemView);

});

;require.register("views/lists/tracklist", function(exports, require, module) {

/*
    Basic track list.

    Features :
    - scrolling with "nicescroll"
    - scroll bar management
*/
var Track, TrackListView, TrackView, ViewCollection, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Track = require('models/track');

ViewCollection = require('lib/view_collection');

TrackView = require('views/lists/tracklist_item');

module.exports = TrackListView = (function(_super) {
  __extends(TrackListView, _super);

  function TrackListView() {
    this.afterRender = __bind(this.afterRender, this);
    _ref = TrackListView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  TrackListView.prototype.className = 'tracks-display';

  TrackListView.prototype.tagName = 'div';

  TrackListView.prototype.template = require('views/templates/tracklist');

  TrackListView.prototype.collectionEl = '#track-list';

  TrackListView.prototype.itemview = TrackView;

  TrackListView.prototype.initialize = function() {
    TrackListView.__super__.initialize.apply(this, arguments);
    return this.views = {};
  };

  TrackListView.prototype.afterRender = function() {
    TrackListView.__super__.afterRender.apply(this, arguments);
    return this.$('.viewport').niceScroll({
      cursorcolor: "#444",
      cursorborder: "",
      cursorwidth: "15px",
      cursorborderradius: "0px",
      horizrailenabled: false,
      cursoropacitymin: "0.3",
      hidecursordelay: "700",
      spacebarenabled: false,
      enablekeyboard: false
    });
  };

  TrackListView.prototype.beforeDetach = function() {
    return this.$('.viewport').getNiceScroll().remove();
  };

  TrackListView.prototype.remove = function() {
    this.$('.viewport').getNiceScroll().remove();
    return TrackListView.__super__.remove.apply(this, arguments);
  };

  return TrackListView;

})(ViewCollection);

});

;require.register("views/lists/tracklist_item", function(exports, require, module) {
var BaseView, TrackListItemView, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

module.exports = TrackListItemView = (function(_super) {
  __extends(TrackListItemView, _super);

  function TrackListItemView() {
    _ref = TrackListItemView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  TrackListItemView.prototype.className = 'track';

  TrackListItemView.prototype.tagName = 'tr';

  TrackListItemView.prototype.template = require('views/templates/tracklist_item');

  return TrackListItemView;

})(BaseView);

});

;require.register("views/lists/tracks", function(exports, require, module) {

/*
    Inherited from tracklist

    Features :
    - sort by title, artist or album
    - navigate amongst files with arrows
    - tracks are highlighted in playlist edition mode
    - queue albums and titles
    - add to playlist
    - delete tracks
    - metadata edition
    - auto fill with blank tracks
*/
var TrackListView, TrackView, TracksView, app, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

app = require('application');

TrackView = require('views/lists/tracks_item');

TrackListView = require('views/lists/tracklist');

module.exports = TracksView = (function(_super) {
  __extends(TracksView, _super);

  function TracksView() {
    this.toggleSort = __bind(this.toggleSort, this);
    this.onClickTableHead = __bind(this.onClickTableHead, this);
    this.updateSortingDisplay = __bind(this.updateSortingDisplay, this);
    this.onClickTrack = __bind(this.onClickTrack, this);
    this.appendBlanckTrack = __bind(this.appendBlanckTrack, this);
    this.beforeDetach = __bind(this.beforeDetach, this);
    this.scrollCheck = __bind(this.scrollCheck, this);
    this.afterRender = __bind(this.afterRender, this);
    _ref = TracksView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  TracksView.prototype.template = require('views/templates/tracks');

  TracksView.prototype.itemview = TrackView;

  TracksView.prototype.events = {
    'click th.field.title': function(event) {
      return this.onClickTableHead(event, 'title');
    },
    'click th.field.artist': function(event) {
      return this.onClickTableHead(event, 'artist');
    },
    'click th.field.album': function(event) {
      return this.onClickTableHead(event, 'album');
    },
    'click th.field.plays': function(event) {
      return this.onClickTableHead(event, 'plays');
    },
    'album:queue': 'queueAlbum',
    'album:pushNext': 'pushNextAlbum',
    'click-track': 'onClickTrack'
  };

  TracksView.prototype.minTrackListLength = 40;

  TracksView.prototype.subscriptions = {
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
    },
    'offScreenNav:newPlaylistSelected': 'highlightTracks'
  };

  TracksView.prototype.initialize = function() {
    TracksView.__super__.initialize.apply(this, arguments);
    this.selectedTrackView = null;
    this.toggleSort(Cookies('defaultSortItem') || 'artist');
    this.elementSort = null;
    this.listenTo(this.collection, 'sort', this.render);
    this.listenTo(this.collection, 'sync', function(e) {
      if (this.collection.length === 0) {
        return Backbone.Mediator.publish('tracklist:isEmpty');
      }
    });
    return Mousetrap.stopCallback = function(e, element, combo) {
      var _ref1;
      if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
        if ((_ref1 = e.which) === 9 || _ref1 === 13 || _ref1 === 27 || _ref1 === 113) {
          return false;
        }
      }
      return element.readOnly === false && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' || (element.contentEditable && element.contentEditable === 'true'));
    };
  };

  TracksView.prototype.afterRender = function() {
    var i, _i, _ref1, _ref2,
      _this = this;
    TracksView.__super__.afterRender.apply(this, arguments);
    this.updateSortingDisplay();
    if (this.collection.length <= this.minTrackListLength) {
      for (i = _i = _ref1 = this.collection.length, _ref2 = this.minTrackListLength; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = _ref1 <= _ref2 ? ++_i : --_i) {
        this.appendBlanckTrack();
      }
    }
    $('.tracks-display tr:odd').addClass('odd');
    if (app.selectedPlaylist != null) {
      this.highlightTracks(app.selectedPlaylist);
    }
    Mousetrap.bind('up', function() {
      var cid, index, prevCid, prevIndex, prevView, view;
      if (_this.selectedTrackView != null) {
        index = _this.collection.indexOf(_this.selectedTrackView.model);
        if (index > 0) {
          prevIndex = index - 1;
          prevCid = _this.collection.at(prevIndex).cid;
          prevView = _this.views[prevCid];
          _this.scrollCheck(prevView);
          return prevView.el.click();
        }
      } else {
        cid = _this.collection.last().cid;
        view = _this.views[cid];
        _this.scrollCheck(view);
        return view.el.click();
      }
    });
    return Mousetrap.bind('down', function() {
      var cid, index, nextCid, nextIndex, nextView, view;
      if (_this.selectedTrackView != null) {
        index = _this.collection.indexOf(_this.selectedTrackView.model);
        if (index < _this.collection.length - 1) {
          nextIndex = index + 1;
          nextCid = _this.collection.at(nextIndex).cid;
          nextView = _this.views[nextCid];
          _this.scrollCheck(nextView);
          return nextView.el.click();
        }
      } else {
        cid = _this.collection.first().cid;
        view = _this.views[cid];
        _this.scrollCheck(view);
        return view.el.click();
      }
    });
  };

  TracksView.prototype.scrollCheck = function(view) {
    var bot, currScroll, diff, h, itemEl, top, vp, vph;
    itemEl = view.$el;
    vp = this.$('.viewport');
    currScroll = vp.scrollTop();
    h = itemEl.height();
    vph = vp.height();
    top = itemEl.position().top;
    bot = top + h;
    if (bot > vph) {
      diff = bot - vph;
      vp.scrollTop(currScroll + diff);
    }
    if (top < 0) {
      return vp.scrollTop(currScroll + top);
    }
  };

  TracksView.prototype.beforeDetach = function() {
    if (this.selectedTrackView != null) {
      this.selectedTrackView.unSelect();
      this.selectedTrackView = null;
    }
    Mousetrap.unbind('up');
    Mousetrap.unbind('down');
    Mousetrap.unbind('enter');
    TracksView.__super__.beforeDetach.apply(this, arguments);
    return false;
  };

  TracksView.prototype.appendBlanckTrack = function() {
    var blankTrack;
    blankTrack = $(document.createElement('tr'));
    blankTrack.addClass("track blank");
    blankTrack.html("<td colspan=\"7\"></td>");
    return this.$collectionEl.append(blankTrack);
  };

  TracksView.prototype.highlightTracks = function(playlist) {
    var track, track2, _i, _len, _ref1, _results;
    this.$('tr.in-playlist').removeClass('in-playlist');
    if (playlist != null) {
      _ref1 = playlist.tracks.models;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        track = _ref1[_i];
        track2 = this.collection.get(track.id);
        if ((track2 != null ? track2.cid : void 0) != null) {
          _results.push(this.views[track2.cid].$el.addClass('in-playlist'));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  TracksView.prototype.onClickTrack = function(e, trackView) {
    if (this.selectedTrackView != null) {
      this.selectedTrackView.unSelect();
    }
    return this.selectedTrackView = trackView;
  };

  TracksView.prototype.updateSortingDisplay = function() {
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

  TracksView.prototype.onClickTableHead = function(event, element) {
    event.preventDefault();
    event.stopPropagation();
    return this.toggleSort(element);
  };

  TracksView.prototype.toggleSort = function(element) {
    var compare, elementArray,
      _this = this;
    if (this.elementSort === element) {
      this.isReverseOrder = !this.isReverseOrder;
    } else {
      this.isReverseOrder = false;
    }
    Cookies.set('defaultSortItem', element);
    this.elementSort = element;
    if (element === 'title') {
      elementArray = ['title', 'artist', 'album', 'track'];
    } else if (element === 'artist') {
      elementArray = ['artist', 'album', 'track', 'title'];
    } else if (element === 'album') {
      elementArray = ['album', 'track', 'title', 'artist'];
    } else if (element === 'plays') {
      elementArray = ['plays', 'title', 'artist', 'album'];
    } else {
      elementArray = [element, null, null, null];
    }
    compare = function(t1, t2) {
      var field1, field2, i, _i;
      for (i = _i = 0; _i <= 3; i = ++_i) {
        field1 = t1.get(elementArray[i]).toString();
        field2 = t2.get(elementArray[i]).toString();
        if (((field1.match(/^[0-9]+$/)) != null) && ((field2.match(/^[0-9]+$/)) != null)) {
          field1 = parseInt(field1);
          field2 = parseInt(field2);
        } else if (((field1.match(/^[0-9]+\/[0-9]+$/)) != null) && ((field2.match(/^[0-9]+\/[0-9]+$/)) != null)) {
          field1 = parseInt(field1.match(/^[0-9]+/));
          field2 = parseInt(field2.match(/^[0-9]+/));
        } else {
          field1 = field1.toLowerCase();
          field2 = field2.toLowerCase();
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

  TracksView.prototype.queueAlbum = function(event, album) {
    var albumsTracks, albumsTracksF;
    albumsTracks = this.collection.where({
      album: album
    });
    albumsTracksF = albumsTracks.filter(function(track) {
      return track.attributes.state === 'server';
    });
    return Backbone.Mediator.publish('tracks:queue', albumsTracksF);
  };

  TracksView.prototype.pushNextAlbum = function(event, album) {
    var albumsTracks, albumsTracksF;
    albumsTracks = this.collection.where({
      album: album
    });
    albumsTracksF = albumsTracks.filter(function(track) {
      return track.attributes.state === 'server';
    });
    return Backbone.Mediator.publish('tracks:pushNext', albumsTracksF);
  };

  return TracksView;

})(TrackListView);

});

;require.register("views/lists/tracks_item", function(exports, require, module) {
var TrackListItemView, TracksItemView, app, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TrackListItemView = require('views/lists/tracklist_item');

app = require('application');

module.exports = TracksItemView = (function(_super) {
  __extends(TracksItemView, _super);

  function TracksItemView() {
    this.importBegin = __bind(this.importBegin, this);
    this.returnToNormal = __bind(this.returnToNormal, this);
    this.onUploadProgressChange = __bind(this.onUploadProgressChange, this);
    this.onCtrlEnter = __bind(this.onCtrlEnter, this);
    this.onEnter = __bind(this.onEnter, this);
    this.onDeleteClick = __bind(this.onDeleteClick, this);
    this.disableEdition = __bind(this.disableEdition, this);
    this.unSelect = __bind(this.unSelect, this);
    this.onClick = __bind(this.onClick, this);
    _ref = TracksItemView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  TracksItemView.prototype.template = require('views/templates/tracks_item');

  TracksItemView.prototype.events = {
    'click #delete-button': 'onDeleteClick',
    'click #play-track-button': function(e) {
      if (e.ctrlKey || e.metaKey) {
        return this.onPlayNextTrack(e);
      } else {
        return this.onQueueTrack(e);
      }
    },
    'click #add-to-button': function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (app.selectedPlaylist != null) {
        return this.onAddTo();
      } else {
        return alert("No playlist selected. Please select a playlist in the navigation bar on the left");
      }
    },
    'dblclick [id$="button"]': function(event) {
      event.preventDefault();
      return event.stopPropagation();
    },
    'dblclick': function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.isEdited !== '') {
        this.disableEdition();
        this.isEdited = '';
      }
      return this.onDblClick(e);
    },
    'click #play-album-button': function(e) {
      if (e.ctrlKey || e.metaKey) {
        return this.onPlayNextAlbum(e);
      } else {
        return this.onQueueAlbum(e);
      }
    },
    'click .title': function(e) {
      return this.onClick(e, 'title');
    },
    'click .artist': function(e) {
      return this.onClick(e, 'artist');
    },
    'click .album': function(e) {
      return this.onClick(e, 'album');
    },
    'click': function(e) {
      return this.onClick(e, '');
    }
  };

  TracksItemView.prototype.initialize = function() {
    var _this = this;
    TracksItemView.__super__.initialize.apply(this, arguments);
    this.listenTo(this.model, 'change:state', this.onStateChange);
    this.listenTo(this.model, 'change:title', function(event) {
      return _this.$('td.field.title input').val(_this.model.attributes.title);
    });
    this.listenTo(this.model, 'change:artist', function(event) {
      return _this.$('td.field.artist input').val(_this.model.attributes.artist);
    });
    this.listenTo(this.model, 'change:album', function(event) {
      return _this.$('td.field.album input').val(_this.model.attributes.album);
    });
    this.listenTo(this.model, 'change:track', function(event) {
      return _this.$('td.field.num').html(_this.model.attributes.track);
    });
    return this.isEdited = '';
  };

  TracksItemView.prototype.onClick = function(event, element) {
    var _this = this;
    event.preventDefault();
    event.stopPropagation();
    if (this.model.attributes.state === 'server') {
      if (this.$el.hasClass('selected')) {
        if (this.isEdited !== element) {
          if (this.isEdited !== '') {
            this.disableEdition();
          }
          this.isEdited = element;
          return this.enableEdition();
        }
      } else {
        this.$el.addClass('selected');
        this.$el.trigger('click-track', this);
        Mousetrap.bind('f2', function() {
          if (_this.isEdited === '') {
            _this.isEdited = 'title';
            return _this.enableEdition();
          }
        });
        Mousetrap.bind('enter', this.onEnter);
        return Mousetrap.bind('ctrl+enter', this.onCtrlEnter);
      }
    }
  };

  TracksItemView.prototype.unSelect = function() {
    var selector;
    this.$el.removeClass('selected');
    if (this.isEdited !== '') {
      selector = "." + this.isEdited + " input";
      this.disableEdition();
      this.isEdited = '';
    }
    Mousetrap.unbind('f2');
    Mousetrap.unbind('enter', this.onEnter);
    return Mousetrap.unbind('ctrl+enter', this.onCtrlEnter);
  };

  TracksItemView.prototype.enableEdition = function() {
    var selector,
      _this = this;
    if (this.isEdited !== '') {
      selector = "." + this.isEdited + " input";
      if (!this.$(selector).hasClass('activated')) {
        this.$(selector).addClass('activated');
        this.$(selector).removeAttr('readonly');
        this.$(selector).focus();
        this.$(selector).select();
        this.tmpValue = this.$(selector).val();
        Mousetrap.unbind('enter', this.onEnter);
        Mousetrap.unbind('ctrl+enter', this.onCtrlEnter);
        Mousetrap.bind('enter', function() {
          _this.disableEdition();
          return _this.isEdited = '';
        });
        Mousetrap.bind('esc', function() {
          _this.$(selector).val(_this.tmpValue);
          _this.disableEdition(false);
          return _this.isEdited = '';
        });
        return Mousetrap.bind('tab', function(e) {
          var oldEdit;
          e.preventDefault();
          _this.disableEdition();
          oldEdit = _this.isEdited;
          _this.isEdited = (function() {
            switch (false) {
              case oldEdit !== 'title':
                return 'artist';
              case oldEdit !== 'artist':
                return 'album';
              case oldEdit !== 'album':
                return 'title';
            }
          })();
          return _this.enableEdition();
        });
      }
    }
  };

  TracksItemView.prototype.disableEdition = function(save) {
    var selector;
    if (save == null) {
      save = true;
    }
    if (this.isEdited !== '') {
      selector = "." + this.isEdited + " input";
      if (this.$(selector).hasClass('activated')) {
        if (save && this.$(selector).val() !== this.tmpValue) {
          this.saveNewValue();
        }
        this.$(selector).blur();
        this.$(selector).attr('readonly', 'readonly');
        this.$(selector).removeClass('activated');
        this.tmpValue = null;
        Mousetrap.unbind('enter');
        Mousetrap.unbind('esc');
        Mousetrap.unbind('tab');
        Mousetrap.bind('enter', this.onEnter);
        return Mousetrap.bind('ctrl+enter', this.onCtrlEnter);
      }
    }
  };

  TracksItemView.prototype.saveNewValue = function() {
    var selector, val,
      _this = this;
    selector = "." + this.isEdited + " input";
    val = this.$(selector).val();
    this.tmpValue = val;
    switch (false) {
      case this.isEdited !== 'title':
        this.model.attributes.title = val;
        break;
      case this.isEdited !== 'artist':
        this.model.attributes.artist = val;
        break;
      case this.isEdited !== 'album':
        this.model.attributes.album = val;
    }
    this.saving = true;
    return this.model.save({
      success: function() {
        return _this.saving = false;
      },
      error: function() {
        alert("An error occured, modifications were not saved.");
        return _this.saving = false;
      }
    });
  };

  TracksItemView.prototype.afterRender = function() {
    var state;
    TracksItemView.__super__.afterRender.apply(this, arguments);
    state = this.model.attributes.state;
    if (state === 'client') {
      return this.initUpload();
    } else if (state === 'uploadStart') {
      this.initUpload();
      return this.startUpload();
    } else if (state === 'importBegin') {
      return this.importBegin();
    }
  };

  TracksItemView.prototype.onDeleteClick = function(event) {
    var state,
      _this = this;
    event.preventDefault();
    event.stopPropagation();
    state = this.model.attributes.state;
    if (state === 'uploadStart' || state === 'importBegin') {
      alert("Wait for upload to finish to delete this track");
      return;
    }
    if (state === 'client') {
      this.model.set({
        state: 'canceled'
      });
    }
    this.model.destroy({
      error: function() {
        return alert("Server error occured, track was not deleted.");
      }
    });
    return Backbone.Mediator.publish('trackItem:remove');
  };

  TracksItemView.prototype.onDblClick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.model.attributes.state === 'server') {
      return Backbone.Mediator.publish('track:playImmediate', this.model);
    }
  };

  TracksItemView.prototype.onQueueTrack = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.model.attributes.state === 'server') {
      return Backbone.Mediator.publish('track:queue', this.model);
    }
  };

  TracksItemView.prototype.onPlayNextTrack = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.model.attributes.state === 'server') {
      return Backbone.Mediator.publish('track:pushNext', this.model);
    }
  };

  TracksItemView.prototype.onEnter = function(event) {
    if (this.model.attributes.state === 'server') {
      return Backbone.Mediator.publish('track:queue', this.model);
    }
  };

  TracksItemView.prototype.onCtrlEnter = function(event) {
    if (this.model.attributes.state === 'server') {
      return Backbone.Mediator.publish('track:pushNext', this.model);
    }
  };

  TracksItemView.prototype.onQueueAlbum = function(event) {
    var album;
    event.preventDefault();
    event.stopPropagation();
    album = this.model.attributes.album;
    if ((album != null) && album !== '') {
      return this.$el.trigger('album:queue', album);
    } else {
      return alert("can't play null album");
    }
  };

  TracksItemView.prototype.onPlayNextAlbum = function(event) {
    var album;
    event.preventDefault();
    event.stopPropagation();
    album = this.model.attributes.album;
    if ((album != null) && album !== '') {
      return this.$el.trigger('album:pushNext', album);
    } else {
      return alert("can't play null album");
    }
  };

  TracksItemView.prototype.onAddTo = function() {
    if (this.model.attributes.state === 'server') {
      app.selectedPlaylist.tracks.add(this.model);
      if (!this.$el.hasClass('in-playlist')) {
        return this.$el.addClass('in-playlist');
      }
    }
  };

  TracksItemView.prototype.onUploadProgressChange = function(e) {
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

  TracksItemView.prototype.onStateChange = function() {
    if (this.model.attributes.state === 'client') {
      return this.initUpload();
    } else if (this.model.attributes.state === 'uploadStart') {
      return this.startUpload();
    } else if (this.model.attributes.state === 'uploadEnd') {
      return this.endUpload();
    } else if (this.model.attributes.state === 'importBegin') {
      return this.importBegin();
    }
  };

  TracksItemView.prototype.initUpload = function() {
    var uploadProgress;
    this.saveAddBtn = this.$('#add-to-button').detach();
    this.savePlayTrackBtn = this.$('#play-track-button').detach();
    uploadProgress = $(document.createElement('div'));
    uploadProgress.addClass('uploadProgress');
    uploadProgress.html('INIT');
    return this.$('#state').append(uploadProgress);
  };

  TracksItemView.prototype.startUpload = function() {
    this.$('.uploadProgress').html('0%');
    return this.listenTo(this.model, 'progress', this.onUploadProgressChange);
  };

  TracksItemView.prototype.endUpload = function() {
    this.stopListening(this.model, 'progress');
    this.$('.uploadProgress').html('DONE');
    return this.$('.uploadProgress').delay(1000).fadeOut(1000, this.returnToNormal);
  };

  TracksItemView.prototype.returnToNormal = function() {
    this.$('.uploadProgress').remove();
    this.$('#state').append(this.saveAddBtn);
    this.$('#state').append(this.savePlayTrackBtn);
    return this.model.attributes.state = 'server';
  };

  TracksItemView.prototype.importBegin = function() {
    var uploadProgress;
    this.saveAddBtn = this.$('#add-to-button').detach();
    this.savePlayTrackBtn = this.$('#play-track-button').detach();
    uploadProgress = $(document.createElement('div'));
    uploadProgress.addClass('uploadProgress');
    uploadProgress.html('WAIT');
    return this.$('#state').append(uploadProgress);
  };

  return TracksItemView;

})(TrackListItemView);

});

;require.register("views/off_screen_nav", function(exports, require, module) {

/*
  Off screen nav view
*/
var BaseView, OffScreenNav, Playlist, PlaylistNavView, ViewCollection, app, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

app = require('application');

BaseView = require('lib/base_view');

Playlist = require('models/playlist');

PlaylistNavView = require('views/playlist_nav_view');

ViewCollection = require('lib/view_collection');

module.exports = OffScreenNav = (function(_super) {
  __extends(OffScreenNav, _super);

  function OffScreenNav() {
    this.toggleNav = __bind(this.toggleNav, this);
    this.magicToggle = __bind(this.magicToggle, this);
    this.afterRender = __bind(this.afterRender, this);
    _ref = OffScreenNav.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OffScreenNav.prototype.className = 'off-screen-nav';

  OffScreenNav.prototype.tagName = 'div';

  OffScreenNav.prototype.template = require('views/templates/off_screen_nav');

  OffScreenNav.prototype.itemview = PlaylistNavView;

  OffScreenNav.prototype.collectionEl = '#playlist-list';

  OffScreenNav.prototype.magicCounterSensibility = 2;

  OffScreenNav.prototype.magicCounter = OffScreenNav.magicCounterSensibility;

  OffScreenNav.prototype.events = {
    'click .add-playlist-button': 'onAddPlaylist',
    'playlist-selected': 'onPlaylistSelected',
    'playlist-unselected': 'unSelect',
    'click': function(e) {
      return this.toggleNav();
    },
    'mousemove': function(e) {
      if (!this.onScreen) {
        return this.magicToggle(e);
      }
    },
    'mouseleave': function(e) {
      if (this.onScreen) {
        return this.toggleNav();
      }
    }
  };

  OffScreenNav.prototype.initialize = function(options) {
    OffScreenNav.__super__.initialize.apply(this, arguments);
    return this.listenTo(this.collection, 'remove', function(playlist) {
      if (app.selectedPlaylist === playlist) {
        return this.unSelect();
      }
    });
  };

  OffScreenNav.prototype.afterRender = function() {
    OffScreenNav.__super__.afterRender.apply(this, arguments);
    this.$('#playlist-list').niceScroll({
      cursorcolor: "#fff",
      cursorborder: "",
      cursorwidth: "2px",
      hidecursordelay: "700",
      horizrailenabled: false,
      spacebarenabled: false,
      enablekeyboard: false
    });
    return this.onScreen = this.$('.off-screen-nav-content').hasClass('off-screen-nav-show');
  };

  OffScreenNav.prototype.magicToggle = function(e) {
    if (e.pageX === 0) {
      this.magicCounter -= 1;
    } else {
      this.magicCounter = this.magicCounterSensibility;
    }
    if (this.magicCounter === 0) {
      this.magicCounter = this.magicCounterSensibility;
      return this.toggleNav();
    }
  };

  OffScreenNav.prototype.toggleNav = function() {
    this.onScreen = !this.onScreen;
    this.$('.off-screen-nav-content').toggleClass('off-screen-nav-show');
    return this.updateDisplay();
  };

  OffScreenNav.prototype.updateDisplay = function() {
    if (this.$('.off-screen-nav-content').hasClass('off-screen-nav-show')) {
      return this.$('.off-screen-nav-toggle-arrow').addClass('on');
    } else {
      return this.$('.off-screen-nav-toggle-arrow').removeClass('on');
    }
  };

  OffScreenNav.prototype.onAddPlaylist = function(event) {
    var defaultMsg, defaultVal, playlist, title,
      _this = this;
    event.preventDefault();
    event.stopPropagation();
    title = "";
    defaultMsg = "Please enter the new playlist title :";
    defaultVal = "my playlist";
    while (!(title !== "" && title.length < 50)) {
      title = prompt(defaultMsg, defaultVal);
      if (title == null) {
        return;
      }
      defaultMsg = "Invalid title, please try again :";
      defaultVal = title;
    }
    playlist = new Playlist({
      title: title
    });
    return this.collection.create(playlist, {
      success: function(model) {
        _this.views[model.cid].$('.select-playlist-button').trigger('click');
        return app.router.navigate('', true);
      },
      error: function() {
        return alert("Server error occured, playlist wasn't created");
      }
    });
  };

  OffScreenNav.prototype.onPlaylistSelected = function(event, playlist) {
    if (app.selectedPlaylist != null) {
      this.views[app.selectedPlaylist.cid].$('li').removeClass('selected');
    }
    app.selectedPlaylist = playlist;
    return Backbone.Mediator.publish('offScreenNav:newPlaylistSelected', playlist);
  };

  OffScreenNav.prototype.unSelect = function() {
    app.selectedPlaylist = null;
    return Backbone.Mediator.publish('offScreenNav:newPlaylistSelected', null);
  };

  return OffScreenNav;

})(ViewCollection);

});

;require.register("views/player/player", function(exports, require, module) {

/*
    Here is the player. This is the bridge beetween Soundmanager2 and Cozic.
*/
var BaseView, Player, VolumeManager, app, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

VolumeManager = require('./volumeManager');

app = require('application');

module.exports = Player = (function(_super) {
  __extends(Player, _super);

  function Player() {
    this.updateProgressDisplay = __bind(this.updateProgressDisplay, this);
    this.printLoadingInfo = __bind(this.printLoadingInfo, this);
    this.onToggleMute = __bind(this.onToggleMute, this);
    this.volumeFilter = __bind(this.volumeFilter, this);
    this.onVolumeChange = __bind(this.onVolumeChange, this);
    this.stopTrack = __bind(this.stopTrack, this);
    this.onPlayFinish = __bind(this.onPlayFinish, this);
    this.onPlayTrack = __bind(this.onPlayTrack, this);
    this.onPlayImmediate = __bind(this.onPlayImmediate, this);
    this.onPushNextMultiple = __bind(this.onPushNextMultiple, this);
    this.onPushNext = __bind(this.onPushNext, this);
    this.onQueueTrackMultiple = __bind(this.onQueueTrackMultiple, this);
    this.onQueueTrack = __bind(this.onQueueTrack, this);
    this.onClickFwd = __bind(this.onClickFwd, this);
    this.onClickRwd = __bind(this.onClickRwd, this);
    this.onClickPlay = __bind(this.onClickPlay, this);
    this.updatePlayButtonDisplay = __bind(this.updatePlayButtonDisplay, this);
    this.afterRender = __bind(this.afterRender, this);
    _ref = Player.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Player.prototype.className = 'player';

  Player.prototype.tagName = 'div';

  Player.prototype.template = require('views/templates/player/player');

  Player.prototype.events = {
    'click #play-button': 'onClickPlay',
    'click #rwd-button': 'onClickRwd',
    'click #fwd-button': 'onClickFwd',
    'mousedown .progress': 'onMouseDownProgress',
    'click #loop-button': 'onClickLoop',
    'click #random-button': 'onClickRandom',
    'soundManager:ready': function(e) {
      this.isLoading = false;
      this.canPlay = true;
      return this.updatePlayButtonDisplay();
    },
    'soundManager:timeout': function(e) {
      this.isLoading = false;
      this.canPlay = false;
      return this.updatePlayButtonDisplay();
    }
  };

  Player.prototype.subscriptions = {
    'track:queue': 'onQueueTrack',
    'tracks:queue': 'onQueueTrackMultiple',
    'track:pushNext': 'onPushNext',
    'tracks:pushNext': 'onPushNextMultiple',
    'track:playImmediate': 'onPlayImmediate',
    'track:play-from': function(track) {
      return this.onPlayTrack(track);
    },
    'track:delete': function(soundId) {
      var _ref1;
      if (((_ref1 = this.currentSound) != null ? _ref1.id : void 0) === soundId) {
        return this.stopTrack();
      }
    },
    'volumeManager:toggleMute': 'onToggleMute',
    'volumeManager:volumeChanged': 'onVolumeChange'
  };

  Player.prototype.initialize = function(options) {
    this.isStopped = true;
    this.isPaused = false;
    this.canPlay = false;
    this.isLoading = true;
    Player.__super__.initialize.apply(this, arguments);
    Mousetrap.bind('space', this.onClickPlay);
    Mousetrap.bind('b', this.onClickRwd);
    return Mousetrap.bind('n', this.onClickFwd);
  };

  Player.prototype.afterRender = function() {
    Player.__super__.afterRender.apply(this, arguments);
    this.playButton = this.$('#play-button');
    if (Cookies('defaultVolume') != null) {
      this.volume = parseInt(Cookies('defaultVolume'));
    } else {
      this.volume = 50;
    }
    this.isMuted = (Cookies('isMuteByDefault') != null) && Cookies('isMuteByDefault') === "true";
    this.volumeManager = new VolumeManager({
      initVol: this.volume,
      initMute: this.isMuted
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
    return this.updatePlayButtonDisplay();
  };

  Player.prototype.updatePlayButtonDisplay = function() {
    var icon;
    icon = this.$('#play-button i');
    icon.removeClass('icon-warning-sign icon-play icon-pause icon-cogs');
    icon.removeClass('activated');
    if (this.isLoading) {
      return icon.addClass('icon-cogs');
    } else if (!this.canPlay) {
      return icon.addClass('icon-warning-sign activated');
    } else if (this.isStopped || this.isPaused) {
      return icon.addClass('icon-play');
    } else {
      return icon.addClass('icon-pause');
    }
  };

  Player.prototype.onClickPlay = function() {
    var _this = this;
    if (!this.isLoading) {
      if (this.canPlay) {
        if (this.currentSound != null) {
          if (this.isStopped) {
            this.currentSound.play();
            this.isStopped = false;
          } else if (this.isPaused) {
            this.currentSound.play();
            this.isPaused = false;
          } else if (!this.isPaused && !this.isStopped) {
            this.currentSound.pause();
            this.isPaused = true;
          }
        } else if (app.playQueue.getCurrentTrack() != null) {
          if (this.isStopped) {
            this.onPlayTrack(app.playQueue.getCurrentTrack());
          }
        } else if (app.playQueue.length === 0) {
          app.tracks.each(function(track) {
            if (track.attributes.state === 'server') {
              return _this.onQueueTrack(track);
            }
          });
        }
        return this.updatePlayButtonDisplay();
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
      prevTrack = app.playQueue.getPrevTrack();
      if (prevTrack != null) {
        return this.onPlayTrack(prevTrack);
      }
    }
  };

  Player.prototype.onClickFwd = function() {
    var nextTrack;
    nextTrack = app.playQueue.getNextTrack();
    if (nextTrack != null) {
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
    var _ref1;
    if (((_ref1 = this.currentSound) != null ? _ref1.id : void 0) === ("sound-" + (track.get('id')))) {
      return;
    }
    app.playQueue.queue(track);
    if (app.playQueue.length === 1) {
      return this.onPlayTrack(app.playQueue.getCurrentTrack());
    } else if (app.playQueue.length - 2 === app.playQueue.atPlay && this.isStopped) {
      return this.onPlayTrack(app.playQueue.getNextTrack());
    }
  };

  Player.prototype.onQueueTrackMultiple = function(tracks) {
    var track, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = tracks.length; _i < _len; _i++) {
      track = tracks[_i];
      _results.push(this.onQueueTrack(track));
    }
    return _results;
  };

  Player.prototype.onPushNext = function(track) {
    var _ref1;
    if (((_ref1 = this.currentSound) != null ? _ref1.id : void 0) === ("sound-" + (track.get('id')))) {
      return;
    }
    app.playQueue.pushNext(track);
    if (app.playQueue.length === 1) {
      return this.onPlayTrack(app.playQueue.getCurrentTrack());
    } else if (app.playQueue.length - 2 === app.playQueue.atPlay && this.isStopped) {
      return this.onPlayTrack(app.playQueue.getNextTrack());
    }
  };

  Player.prototype.onPushNextMultiple = function(tracks) {
    var pq, track, _i, _len, _results;
    pq = app.playQueue;
    if (pq.length === 0 || (pq.length - 1 === pq.atPlay && this.isStopped)) {
      this.onPushNext(tracks.shift());
    }
    tracks.reverse();
    _results = [];
    for (_i = 0, _len = tracks.length; _i < _len; _i++) {
      track = tracks[_i];
      _results.push(this.onPushNext(track));
    }
    return _results;
  };

  Player.prototype.onPlayImmediate = function(track) {
    var nextTrack, _ref1;
    if (((_ref1 = this.currentSound) != null ? _ref1.id : void 0) === ("sound-" + (track.get('id')))) {
      nextTrack = track;
    } else {
      app.playQueue.pushNext(track);
      if (app.playQueue.length === 1) {
        nextTrack = app.playQueue.getCurrentTrack();
      } else {
        nextTrack = app.playQueue.getNextTrack();
      }
    }
    return this.onPlayTrack(nextTrack);
  };

  Player.prototype.onPlayTrack = function(track) {
    var artist, encA, encT, nfo, title, url;
    Backbone.Mediator.publish('player:start-sound', track.get('id'));
    if (this.currentSound != null) {
      if (this.currentSound.id === ("sound-" + (track.get('id')))) {
        this.currentSound.setPosition(0);
        this.currentSound.play();
        this.updateProgressDisplay();
        return;
      } else {
        this.stopTrack();
      }
    }
    url = "tracks/" + (track.get('id')) + "/attach/" + (track.get('slug'));
    this.currentSound = app.soundManager.createSound({
      id: "sound-" + (track.get('id')),
      url: url,
      usePolicyFile: true,
      volume: this.volumeFilter(this.volume),
      autoPlay: true,
      onfinish: this.onPlayFinish,
      onstop: this.stopTrack,
      whileplaying: this.updateProgressDisplay,
      multiShot: false
    });
    if (this.isMuted) {
      this.currentSound.mute();
    }
    this.isStopped = false;
    this.isPaused = false;
    this.updatePlayButtonDisplay();
    title = track.get('title');
    artist = track.get('artist');
    nfo = "" + title + " - <i>" + artist + "</i>";
    this.$('.id3-info').html(nfo);
    encT = title === "" ? "%20" : encodeURIComponent(title);
    encA = artist === "" ? "%20" : encodeURIComponent(artist);
    return $.ajax("broadcast/" + (encodeURIComponent(url)) + "/" + encT + "/" + encA, {
      type: 'PUT',
      error: function(jqXHR, textStatus, errorThrown) {
        return console.log("ajax fail : " + textStatus);
      }
    });
  };

  Player.prototype.onPlayFinish = function() {
    var nextTrack;
    nextTrack = app.playQueue.getNextTrack();
    if (nextTrack != null) {
      return this.onPlayTrack(nextTrack);
    } else {
      return this.stopTrack();
    }
  };

  Player.prototype.stopTrack = function() {
    Backbone.Mediator.publish('player:stop-sound');
    if (this.currentSound != null) {
      this.currentSound.destruct();
      this.currentSound = null;
    }
    this.isStopped = true;
    this.isPaused = false;
    this.updatePlayButtonDisplay();
    this.progressInner.width("0%");
    this.elapsedTime.html("&nbsp;0:00");
    this.remainingTime.html("&nbsp;0:00");
    this.$('.id3-info').html("-");
    if (app.isBroadcastEnabled) {
      return $.ajax("broadcast", {
        type: 'DELETE',
        error: function(jqXHR, textStatus, errorThrown) {
          return console.log("ajax fail : " + textStatus);
        }
      });
    }
  };

  Player.prototype.onVolumeChange = function(volume) {
    this.volume = volume;
    Cookies.set('defaultVolume', volume);
    if (this.currentSound != null) {
      return this.currentSound.setVolume(this.volumeFilter(volume));
    }
  };

  Player.prototype.volumeFilter = function(volume) {
    var newVol;
    newVol = volume * 0.01;
    newVol = newVol * newVol;
    newVol = newVol * 100 + 1;
    return newVol;
  };

  Player.prototype.onToggleMute = function() {
    this.isMuted = !this.isMuted;
    Cookies.set('isMuteByDefault', "" + this.isMuted);
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
    var bl, buf, i, printBuf, tot, _i, _len, _ref1,
      _this = this;
    bl = Math.floor(this.currentSound.bytesLoaded / this.currentSound.bytesTotal * 100);
    if (this.bytesLoaded == null) {
      this.bytesLoaded = -1;
    }
    if (this.bytesLoaded !== bl) {
      this.bytesLoaded = bl;
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
      console.log("bytes loaded : " + bl);
      return console.log("");
    } else {
      return console.log("refresh");
    }
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
    var loopIcon;
    loopIcon = this.$('#loop-button i');
    if (loopIcon.hasClass('icon-refresh')) {
      if (loopIcon.hasClass('activated')) {
        app.playQueue.playLoop = 'repeat-one';
        loopIcon.toggleClass('activated');
        return loopIcon.toggleClass('icon-refresh icon-repeat activated');
      } else {
        app.playQueue.playLoop = 'repeat-all';
        return loopIcon.toggleClass('activated');
      }
    } else {
      app.playQueue.playLoop = 'no-repeat';
      return loopIcon.toggleClass('icon-refresh icon-repeat activated');
    }
  };

  Player.prototype.onClickRandom = function() {
    return app.playQueue.randomize();
  };

  return Player;

})(BaseView);

});

;require.register("views/player/volumeManager", function(exports, require, module) {
var BaseView, VolumeManager, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

module.exports = VolumeManager = (function(_super) {
  __extends(VolumeManager, _super);

  function VolumeManager() {
    this.toggleMute = __bind(this.toggleMute, this);
    this.volDown = __bind(this.volDown, this);
    this.volUp = __bind(this.volUp, this);
    this.onClickToggleMute = __bind(this.onClickToggleMute, this);
    this.onMouseUpSlider = __bind(this.onMouseUpSlider, this);
    this.onMouseMoveSlider = __bind(this.onMouseMoveSlider, this);
    _ref = VolumeManager.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  VolumeManager.prototype.className = 'volume';

  VolumeManager.prototype.tagName = 'div';

  VolumeManager.prototype.template = require('views/templates/player/volumeManager');

  VolumeManager.prototype.events = {
    'mousedown .slider': 'onMouseDownSlider',
    'click #volume-switch-button': 'onClickToggleMute'
  };

  VolumeManager.prototype.initialize = function(options) {
    VolumeManager.__super__.initialize.apply(this, arguments);
    this.volumeValue = options.initVol;
    this.isMuted = options.initMute;
    Mousetrap.bind('m', this.toggleMute);
    Mousetrap.bind('+', this.volUp);
    return Mousetrap.bind('-', this.volDown);
  };

  VolumeManager.prototype.afterRender = function() {
    var toggledClasses;
    VolumeManager.__super__.afterRender.apply(this, arguments);
    this.slidableZone = $(document);
    this.slider = this.$('.slider');
    this.sliderContainer = this.$('.slider-container');
    this.sliderInner = this.$('.slider-inner');
    if (this.isMuted) {
      this.sliderInner.width("0%");
      toggledClasses = 'icon-volume-up icon-volume-off activated';
      return this.$('#volume-switch-button i').toggleClass(toggledClasses);
    } else {
      return this.sliderInner.width("" + this.volumeValue + "%");
    }
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
    this.slidableZone.off('mousemove');
    return this.slidableZone.off('mouseup');
  };

  VolumeManager.prototype.onClickToggleMute = function(event) {
    event.preventDefault();
    return this.toggleMute();
  };

  VolumeManager.prototype.volUp = function() {
    this.volumeValue = parseInt(this.volumeValue) + 10;
    return this.controlVolumeValue();
  };

  VolumeManager.prototype.volDown = function() {
    this.volumeValue = parseInt(this.volumeValue) - 10;
    return this.controlVolumeValue();
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
    var toggledClasses;
    Backbone.Mediator.publish('volumeManager:toggleMute', this.volumeValue);
    toggledClasses = 'icon-volume-up icon-volume-off activated';
    this.$('#volume-switch-button i').toggleClass(toggledClasses);
    this.isMuted = !this.isMuted;
    return this.updateDisplay();
  };

  return VolumeManager;

})(BaseView);

});

;require.register("views/playlist_nav_view", function(exports, require, module) {
var BaseView, PlaylistNavView, PlaylistTrackCollection, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

PlaylistTrackCollection = require('collections/playlist');

module.exports = PlaylistNavView = (function(_super) {
  __extends(PlaylistNavView, _super);

  function PlaylistNavView() {
    this.onSelectClick = __bind(this.onSelectClick, this);
    _ref = PlaylistNavView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PlaylistNavView.prototype.className = 'playlist';

  PlaylistNavView.prototype.tagName = 'div';

  PlaylistNavView.prototype.template = require('views/templates/playlist_nav');

  PlaylistNavView.prototype.events = {
    'click .select-playlist-button': 'onSelectClick',
    'click .delete-playlist-button': 'onDeleteClick'
  };

  PlaylistNavView.prototype.initialize = function() {
    PlaylistNavView.__super__.initialize.apply(this, arguments);
    return this.listenTo(this.model, 'change:id', this.onIdChange);
  };

  PlaylistNavView.prototype.onIdChange = function() {
    return this.$('a').attr('href', "#playlist/" + this.model.id);
  };

  PlaylistNavView.prototype.onSelectClick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.$('li').hasClass('selected')) {
      this.$('li').addClass('selected');
      return this.$el.trigger('playlist-selected', this.model);
    } else {
      this.$('li').removeClass('selected');
      return this.$el.trigger('playlist-unselected');
    }
  };

  PlaylistNavView.prototype.onDeleteClick = function(event) {
    var _this = this;
    event.preventDefault();
    event.stopPropagation();
    if (confirm("Are you sure? the playlist will be deleted definitively.")) {
      return this.model.destroy({
        error: function() {
          return alert("Server error occured, track was not deleted.");
        }
      });
    }
  };

  return PlaylistNavView;

})(BaseView);

});

;require.register("views/templates/home", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div id="content"><div id="top-nav"></div><div id="off-screen-nav"></div><div id="tracks-display"></div><div id="player"></div></div>');
}
return buf.join("");
};
});

;require.register("views/templates/off_screen_nav", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="off-screen-nav-toggle"><div class="off-screen-nav-toggle-handler"><div class="off-screen-nav-toggle-arrow"></div></div></div><div class="off-screen-nav-content"><div id="playlist-title-list" class="off-screen-nav-title">Playlists<div title="create" class="off-screen-nav-button add-playlist-button"></div></div><ul id="playlist-list"></ul></div>');
}
return buf.join("");
};
});

;require.register("views/templates/player/player", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="player-element"><div id="rwd-button" title="play previous track" class="player-button size-26"><i class="icon-backward"></i></div><div id="play-button" title="play/pause" class="player-button size-34"><i class="icon-cogs"></i></div><div id="fwd-button" title="play next track" class="player-button size-26"><i class="icon-forward"></i></div></div><div class="player-element"><div class="progress-side"><div id="loop-button" title="no-repeat/repeat-all/repeat-one" class="progress-side-control"><i class="icon-refresh"></i></div><div class="time left"><span id="elapsedTime"></span></div></div><div class="progress-info"><div class="id3-info">-</div><div class="progress"><div class="inner"></div></div></div><div class="progress-side"><div id="random-button" title="randomize" class="progress-side-control"><i class="icon-random"></i></div><div class="time right"><span id="remainingTime"></span></div></div></div><div class="player-element"><span id="volume"></span></div>');
}
return buf.join("");
};
});

;require.register("views/templates/player/volumeManager", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div id="volume-switch-button" title="mute/unmute"><i class="icon-volume-up"></i></div><div class="slider"><div class="slider-container"><div class="slider-inner"><div class="slider-handle"></div></div></div></div>');
}
return buf.join("");
};
});

;require.register("views/templates/playlist", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="viewport"><table><thead><tr><th id="playlist-play" title="push playlist in the play queue" class="left"><i class="icon-play"></i></th><th class="field title">Title</th><th class="field artist">Artist</th><th class="field album">Album</th><th class="field num">#</th><th class="right"></th></tr></thead><tbody id="track-list"></tbody></table></div>');
}
return buf.join("");
};
});

;require.register("views/templates/playlist_nav", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<a');
buf.push(attrs({ 'href':("#playlist/" + (model.id) + "") }, {"href":true}));
buf.push('><li');
buf.push(attrs({ 'title':("" + (model.title) + "") }, {"title":true}));
buf.push('>' + escape((interp = model.title) == null ? '' : interp) + '<div title="select playlist : track will be added to this playlist when clicking on the + button" class="off-screen-nav-button select-playlist-button"></div><div title="delete definitively" class="off-screen-nav-button delete-playlist-button"></div></li></a>');
}
return buf.join("");
};
});

;require.register("views/templates/playqueue", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="viewport"><table><thead><tr><th class="left"><div title="save as playlist" class="thead-button save-button"></div><div title="show/hide previously played" class="thead-button show-prev-button"></div></th><th class="field title">Title</th><th class="field artist">Artist</th><th class="field album">Album</th><th class="field num">#</th><th class="right"><div title="clear the queue" class="thead-button clear"></div></th></tr></thead><tbody id="track-list"></tbody></table></div>');
}
return buf.join("");
};
});

;require.register("views/templates/playqueue_item", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<td id="state" class="left"><div id="mini-play-button" title="play from here" class="player-button size-20"><i class="icon-play"></i></div></td><td class="field title">' + escape((interp = model.title) == null ? '' : interp) + '</td><td class="field artist">' + escape((interp = model.artist) == null ? '' : interp) + '</td><td class="field album">' + escape((interp = model.album) == null ? '' : interp) + '</td><td class="field num">' + escape((interp = model.track) == null ? '' : interp) + '</td><td class="right"><div id="delete-button" title="remove" class="player-button size-20 signal-button"><i class="icon-remove"></i></div><div id="delete-from-here-button" title="clear from here" class="player-button size-20 signal-button"><i class="icon-arrow-down"></i></div></td>');
}
return buf.join("");
};
});

;require.register("views/templates/top_nav", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<a href="#" title="go to your songs"><div id="top-nav-title-home" class="top-nav-title"><span class="top-nav-text">COZIC&nbsp;</span><i class="icon-home"></i></div></a><a href="#playqueue" title="go to the play queue"><div id="top-nav-title-list" class="top-nav-title"><span class="top-nav-text">Up Next&nbsp;</span><i class="icon-list"></i></div></a><div id="upload-form" title="click to add tracks" class="top-nav-title"><span class="top-nav-text">Upload&nbsp;</span><i class="icon-cloud-upload"></i></div><div id="youtube-import" title="import sounds from Youtube" class="top-nav-title"><span class="top-nav-text">Youtube&nbsp;</span><i class="icon-youtube"></i></div><div id="broadcast" title="broadcast your cozic" class="top-nav-title"><span class="top-nav-text">Broadcast&nbsp;</span><i class="icon-rss"></i></div>');
}
return buf.join("");
};
});

;require.register("views/templates/tracklist", function(exports, require, module) {
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

;require.register("views/templates/tracklist_item", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<td id="state" class="left"></td><td class="field title">' + escape((interp = model.title) == null ? '' : interp) + '</td><td class="field artist">' + escape((interp = model.artist) == null ? '' : interp) + '</td><td class="field album">' + escape((interp = model.album) == null ? '' : interp) + '</td><td class="field num">' + escape((interp = model.track) == null ? '' : interp) + '</td><td class="right"><div id="delete-button" title="remove" class="player-button size-20 signal-button"><i class="icon-remove"></i></div></td>');
}
return buf.join("");
};
});

;require.register("views/templates/tracks", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="viewport"><table><thead><tr><th class="left"></th><th class="field title clickable-cell">Title</th><th title="plays counter" class="field plays clickable-cell">#</th><th class="field artist clickable-cell">Artist</th><th class="field album clickable-cell">Album</th><th title="track number" class="field num">#</th><th class="right"></th></tr></thead><tbody id="track-list"></tbody></table></div>');
}
return buf.join("");
};
});

;require.register("views/templates/tracks_item", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<td id="state" class="left"><div id="add-to-button" title="add to playlist" class="player-button size-20"><i class="icon-plus"></i></div><div id="play-track-button" title="queue this song" class="player-button size-20"><i class="icon-share-alt"></i></div></td><td class="field title"><input');
buf.push(attrs({ 'type':("text"), 'value':("" + (model.title) + ""), 'readonly':(true), "class": ('mousetrap') }, {"type":true,"value":true,"readonly":true}));
buf.push('/></td><td class="field plays">' + escape((interp = model.plays) == null ? '' : interp) + '</td><td class="field artist"><input');
buf.push(attrs({ 'type':("text"), 'value':("" + (model.artist) + ""), 'readonly':(true), "class": ('mousetrap') }, {"type":true,"value":true,"readonly":true}));
buf.push('/></td><td class="field album"><input');
buf.push(attrs({ 'type':("text"), 'value':("" + (model.album) + ""), 'readonly':(true), "class": ('mousetrap') }, {"type":true,"value":true,"readonly":true}));
buf.push('/><div id="play-album-button" title="queue this album" class="player-button size-20"><i class="icon-share"></i></div></td><td class="field num">' + escape((interp = model.track) == null ? '' : interp) + '</td><td class="right"><div id="delete-button" title="delete definitively" class="player-button size-20 signal-button"><i class="icon-remove"></i></div></td>');
}
return buf.join("");
};
});

;require.register("views/top_nav", function(exports, require, module) {
var BaseView, TopNav, app, uploader, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

app = require('application');

uploader = require('models/uploader');

module.exports = TopNav = (function(_super) {
  __extends(TopNav, _super);

  function TopNav() {
    this.onClickYoutube = __bind(this.onClickYoutube, this);
    this.handleFiles = __bind(this.handleFiles, this);
    this.onDragOut = __bind(this.onDragOut, this);
    this.onDragOver = __bind(this.onDragOver, this);
    this.onFilesDropped = __bind(this.onFilesDropped, this);
    this.onUploadFormChange = __bind(this.onUploadFormChange, this);
    this.setupHiddenFileInput = __bind(this.setupHiddenFileInput, this);
    _ref = TopNav.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  TopNav.prototype.className = 'top-nav';

  TopNav.prototype.tagName = 'div';

  TopNav.prototype.template = require('views/templates/top_nav');

  TopNav.prototype.events = {
    'click #upload-form': 'onClick',
    'click #youtube-import': 'onClickYoutube',
    'click #broadcast': 'onClickBroadcast'
  };

  TopNav.prototype.subscriptions = {
    'tracklist:isEmpty': 'onEmptyTrackList'
  };

  TopNav.prototype.afterRender = function() {
    return this.setupHiddenFileInput();
  };

  TopNav.prototype.onEmptyTrackList = function() {
    return this.$('td#h2').html("Drop files here or click to add tracks");
  };

  TopNav.prototype.setupHiddenFileInput = function() {
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

  TopNav.prototype.onUploadFormChange = function(event) {
    this.handleFiles(this.hiddenFileInput.files);
    return this.setupHiddenFileInput();
  };

  TopNav.prototype.onClick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return this.hiddenFileInput.click();
  };

  TopNav.prototype.onFilesDropped = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.$el.removeClass('dragover');
    $('.player').removeClass('dragover');
    event.dataTransfer = event.originalEvent.dataTransfer;
    return this.handleFiles(event.dataTransfer.files);
  };

  TopNav.prototype.onDragOver = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.$el.hasClass('dragover')) {
      this.$el.addClass('dragover');
      return $('.player').addClass('dragover');
    }
  };

  TopNav.prototype.onDragOut = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.$el.hasClass('dragover')) {
      this.$el.removeClass('dragover');
      return $('.player').removeClass('dragover');
    }
  };

  TopNav.prototype.handleFiles = function(files) {
    var curUrl;
    curUrl = "" + document.URL;
    if (curUrl.match(/playlist/) || curUrl.match(/playqueue/)) {
      app.router.navigate('', true);
    }
    return uploader.process(files);
  };

  TopNav.prototype.onClickYoutube = function(event) {
    var curUrl, defaultMsg, defaultVal, input, isValidInput, startIndex, youId;
    event.preventDefault();
    event.stopPropagation();
    defaultMsg = "Please enter a youtube url :";
    defaultVal = "http://www.youtube.com/watch?v=KMU0tzLwhbE";
    isValidInput = false;
    while (!isValidInput) {
      input = prompt(defaultMsg, defaultVal);
      if (input == null) {
        return;
      }
      if (input.match(/^https/)) {
        input = input.replace(/^https:\/\//i, 'http://');
      }
      if (input.match(/^http:\/\/www.youtube.com\/watch?/)) {
        startIndex = input.search(/v=/) + 2;
        isValidInput = true;
        youId = input.substr(startIndex, 11);
      } else if (input.match(/^http:\/\/youtu.be\//)) {
        isValidInput = true;
        youId = input.substr(16, 11);
      } else if (input.length === 11) {
        isValidInput = true;
        youId = input;
      }
      defaultMsg = "Invalid youtube url, please try again :";
      defaultVal = input;
    }
    curUrl = "" + document.URL;
    if (curUrl.match(/playlist/) || curUrl.match(/playqueue/)) {
      app.router.navigate('', true);
    }
    return uploader.processYoutube(youId);
  };

  TopNav.prototype.onClickBroadcast = function(event) {
    var url;
    event.preventDefault();
    event.stopPropagation();
    this.$('#broadcast').toggleClass('activated');
    if (this.$('#broadcast').hasClass('activated')) {
      url = document.URL;
      alert("Your friends can now listen your current mix at\n" + (url.replace(/\/#?apps\/cozic\/.*$/, '')) + "/public/cozic/");
      app.isBroadcastEnabled = true;
      return $.ajax("broadcast", {
        type: 'GET',
        error: function(jqXHR, textStatus, errorThrown) {
          return console.log("ajax fail : " + textStatus);
        }
      });
    } else {
      app.isBroadcastEnabled = false;
      return $.ajax("broadcast", {
        type: 'DELETE',
        error: function(jqXHR, textStatus, errorThrown) {
          return console.log("ajax fail : " + textStatus);
        }
      });
    }
  };

  return TopNav;

})(BaseView);

});

;
//# sourceMappingURL=app.js.map