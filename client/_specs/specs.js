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

var createSinonServer;

createSinonServer = function() {
  var createAutoResponse, server;

  this.server = server = sinon.fakeServer.create();
  createAutoResponse = function(method, url, code, JSONResponder) {
    return server.respondWith(method, url, function(req) {
      var body, headers, res;

      body = JSON.parse(req.requestBody);
      res = JSONResponder(req, body);
      headers = {
        'Content-Type': 'application/json'
      };
      return req.respond(code, headers, JSON.stringify(res));
    });
  };
  this.server.checkLastRequestIs = function(method, url) {
    var req;

    req = server.requests[server.requests.length - 1];
    expect(req.url).to.equal(url);
    return expect(req.method).to.equal(method);
  };
  createAutoResponse('POST', 'albums', 200, function(req, body) {
    return {
      id: 'a1',
      title: body.title,
      description: body.description
    };
  });
  createAutoResponse('GET', 'albums/a1', 200, function(req) {
    return {
      id: 'a1',
      title: 'title',
      description: 'description'
    };
  });
  createAutoResponse('PUT', 'albums/a1', 200, function(req, body) {
    return {
      id: body.id,
      title: body.title,
      description: body.description
    };
  });
  createAutoResponse('DELETE', 'albums/a1', 200, function(req, body) {
    return {
      success: 'album deleted'
    };
  });
  return this.server;
};
;
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

describe('lib/base_view', function() {
  var BaseView, options, spyRenderData, spyTemplate, testView, _ref;

  BaseView = require('lib/base_view');
  testView = (function(_super) {
    __extends(testView, _super);

    function testView() {
      _ref = testView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    testView.prototype.template = function() {
      return '<div id="test"></div>';
    };

    testView.prototype.getRenderData = function() {
      return {
        key: 'value'
      };
    };

    return testView;

  })(BaseView);
  options = {
    optkey: 'optvalue'
  };
  spyTemplate = sinon.spy(testView.prototype, 'template');
  spyRenderData = sinon.spy(testView.prototype, 'getRenderData');
  it('should not call anything on creation', function() {
    this.view = new testView(options);
    expect(spyTemplate.called).to.be["false"];
    return expect(spyRenderData.called).to.be["false"];
  });
  it('should not throw on render', function() {
    return this.view.render();
  });
  it('should have called getRenderData', function() {
    return expect(spyRenderData.calledOnce).to.be["true"];
  });
  it('should have called template with renderData and options', function() {
    var arg;

    expect(spyTemplate.calledOnce).to.be["true"];
    arg = spyTemplate.firstCall.args[0];
    expect(arg).to.have.property('key', 'value');
    return expect(arg).to.have.property('optkey', 'optvalue');
  });
  return it('should contains the template', function() {
    return expect(this.view.$el.find('#test')).to.have.length(1);
  });
});
;
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

describe('lib/view_collection', function() {
  var BaseView, ViewCollection, myCollection, myCollectionView, myModel, myView, options, spyItemRemove, spyItemRender, spyItemTemplate, spyRender, spyTemplate, _ref, _ref1, _ref2, _ref3;

  BaseView = require('lib/base_view');
  ViewCollection = require('lib/view_collection');
  myModel = (function(_super) {
    __extends(myModel, _super);

    function myModel() {
      _ref = myModel.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return myModel;

  })(Backbone.Model);
  myCollection = (function(_super) {
    __extends(myCollection, _super);

    function myCollection() {
      _ref1 = myCollection.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    myCollection.prototype.model = myModel;

    return myCollection;

  })(Backbone.Collection);
  myView = (function(_super) {
    __extends(myView, _super);

    function myView() {
      _ref2 = myView.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    myView.prototype.className = 'item';

    myView.prototype.template = function() {
      return 'item content';
    };

    myView.prototype.getRenderData = function() {
      return this.model.attributes;
    };

    return myView;

  })(BaseView);
  myCollectionView = (function(_super) {
    __extends(myCollectionView, _super);

    function myCollectionView() {
      _ref3 = myCollectionView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    myCollectionView.prototype.itemView = myView;

    myCollectionView.prototype.template = function() {
      return '<div id="test"></div>';
    };

    myCollectionView.prototype.itemViewOptions = function() {
      return {
        optkey: 'optvalue'
      };
    };

    return myCollectionView;

  })(ViewCollection);
  options = {
    optkey: 'optvalue'
  };
  spyRender = sinon.spy(myCollectionView.prototype, 'render');
  spyTemplate = sinon.spy(myCollectionView.prototype, 'template');
  spyItemRender = sinon.spy(myView.prototype, 'render');
  spyItemRemove = sinon.spy(myView.prototype, 'remove');
  spyItemTemplate = sinon.spy(myView.prototype, 'template');
  it('should not call anything on creation', function() {
    this.collection = new myCollection();
    this.view = new myCollectionView({
      collection: this.collection
    });
    expect(spyTemplate.called).to.be["false"];
    return expect(spyRender.called).to.be["false"];
  });
  it('should render a subview when I add a model to the collection', function() {
    var arg;

    this.model = new myModel({
      attribute1: 'value1'
    });
    this.collection.add(this.model);
    expect(spyItemRender.calledOnce).to.be["true"];
    expect(spyItemTemplate.calledOnce).to.be["true"];
    arg = spyItemTemplate.firstCall.args[0];
    expect(arg).to.have.property('attribute1', 'value1');
    expect(arg).to.have.property('optkey', 'optvalue');
    return expect(this.view.$el.find('.item')).to.have.length(1);
  });
  it('should not touch subviews on render', function() {
    var i, _i;

    for (i = _i = 1; _i <= 100; i = ++_i) {
      this.view.render();
    }
    expect(spyItemRender.calledOnce).to.be["true"];
    expect(spyItemTemplate.calledOnce).to.be["true"];
    return expect(this.view.$el.find('#test')).to.have.length(1);
  });
  it('should remove the subview when I remove the model', function() {
    this.collection.remove(this.model);
    return expect(this.view.$el.find('.item')).to.have.length(0);
  });
  return it('should not keep a reference to the view', function() {
    expect(_.size(this.view.views)).to.equal(0);
    return expect(spyItemRemove.calledOnce).to.be["true"];
  });
});
;
describe('vCard Import', function() {
  var Contact, ContactView, VCFS;

  Contact = require('models/contact');
  ContactView = require('views/contact');
  before(function() {
    var polyglot;

    polyglot = new Polyglot();
    polyglot.extend(require('locales/en'));
    return window.t = polyglot.t.bind(polyglot);
  });
  VCFS = {
    google: "BEGIN:VCARD\nVERSION:3.0\nN:Test;Cozy;;;\nFN:Cozy Test\nEMAIL;TYPE=INTERNET;TYPE=WORK:cozytest@cozycloud.cc\nEMAIL;TYPE=INTERNET;TYPE=HOME:cozytest2@cozycloud.cc\nTEL;TYPE=CELL:0600000000\nTEL;TYPE=WORK:0610000000\nADR;TYPE=HOME:;;1 Sample Adress;PARIS;;75001;FRANCE\nADR;TYPE=WORK:;;2 Sample Address;PARIS;;75002;FRANCE\nORG:Cozycloud\nTITLE:Testeur Fou\nBDAY:1989-02-02\nitem1.URL:http\\://test.example.com\nitem1.X-ABLabel:PROFILE\nitem2.EMAIL;TYPE=INTERNET:test3@example.com\nitem2.X-ABLabel:truc\nitem3.X-ABDATE:2013-01-01\nitem3.X-ABLabel:_$!<Anniversary>!$_\nitem4.X-ABRELATEDNAMES:Cozypouet\nitem4.X-ABLabel:_$!<Friend>!$_\nNOTE:Something\nTITLE:CEO\nEND:VCARD",
    android: "BEGIN:VCARD\nVERSION:2.1\nN:Test;Cozy;;;\nFN:Cozy Test\nNOTE:Something\nX-ANDROID-CUSTOM:vnd.android.cursor.item/nickname;Cozypseudo;1;;;;;;;;;;;;;\nTEL;CELL:060-000-0000\nEMAIL;WORK:cozytest@cozycloud.cc\nEMAIL;HOME:cozytest2@cozycloud.cc\nADR;HOME:;;1 Sample Adress 75001 Paris;;;;\nADR;HOME2:;;2 Sample Adress 75001 Paris;;;;\nORG:Cozycloud\nTITLE:Testeur Fou\nX-ANDROID-CUSTOM:vnd.android.cursor.item/contact_event;2013-01-01;0;Date Perso;;;;;;;;;;;;\nX-ANDROID-CUSTOM:vnd.android.cursor.item/contact_event;2013-01-01;1;;;;;;;;;;;;;\nBDAY:1989-02-02\nX-ANDROID-CUSTOM:vnd.android.cursor.item/relation;Cozypouet;6;;;;;;;;;;;;;\nEND:VCARD",
    apple: "BEGIN:VCARD\nVERSION:3.0\nN:Test;Cozy;;;\nFN:Cozy Test\nORG:Cozycloud;\nTITLE:Testeur Fou\nEMAIL;type=INTERNET;type=WORK;type=pref:cozytest@cozycloud.cc\nEMAIL;type=INTERNET;type=HOME:cozytest2@cozycloud.cc\nTEL;type=CELL;type=pref:06 00 00 00 00\nTEL;type=CELL;type=WORK:06 00 00 00 00\nADR;type=HOME;type=pref:;;43 rue blabla;Paris;;750000;France\nitem1.ADR;type=WORK;type=pref:;;18 rue poulet;Paris;;75000;France\nitem1.X-ABADR:fr\nBDAY;value=date:1999-02-01\nX-AIM;type=HOME;type=pref:cozypseudo\nitem2.X-ABRELATEDNAMES;type=pref:Cozypouet\nitem2.X-ABLabel:_$!<Friend>!$_\nX-ABUID:7EC63789-9F24-4F95-AF74-A85483437BC8\:ABPerson\nNOTE:Something\nEND:VCARD"
  };
  return _.each(VCFS, function(vcf, vendor) {
    it("should parse a " + vendor + " vCard", function() {
      var contacts, dp;

      contacts = Contact.fromVCF(vcf);
      expect(contacts.length).to.equal(1);
      this.contact = contacts.at(0);
      expect(this.contact.attributes).to.have.property('fn', 'Cozy Test');
      dp = this.contact.dataPoints.findWhere({
        name: 'email',
        type: 'work',
        value: 'cozytest@cozycloud.cc'
      });
      expect(dp).to.not.be.an('undefined');
      dp = this.contact.dataPoints.findWhere({
        name: 'other',
        type: 'friend',
        value: 'Cozypouet'
      });
      expect(dp).to.not.be.an('undefined');
      dp = this.contact.dataPoints.findWhere({
        name: 'about',
        type: 'title',
        value: 'Testeur Fou'
      });
      return expect(dp).to.not.be.an('undefined');
    });
    return it('and the generated contact should not bug ContactView', function() {
      var view;

      view = new ContactView({
        model: this.contact
      });
      $('#sandbox').append(view.$el);
      view.render();
      return setTimeout(function() {
        view.remove();
        return this.contact = null;
      }, 50);
    });
  });
});
;
