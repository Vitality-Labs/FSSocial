'use strict';

angular.module('fssocial.common').factory('api', function ($rootScope, $http, $window) {
  var apiBase = 'api/v1',
      token = ($window.sessionStorage.token || $window.localStorage.token),
      headers = {Authorization: 'Bearer ' + token},
      wsHost = ($window.document.location.origin || ($window.location.protocol + '//' + $window.location.host)).replace(/^http/, 'ws'),
      api = {events: {}};

  if (token) {
    var ws = api.ws = new WebSocket(wsHost + '?access_token=' + token);
  }
  $window.setInterval(function () {
    if (ws) {
      var message = 'ping'
      var usr = JSON.parse(($window.sessionStorage.user || $window.localStorage.user));
      if (usr) {
        message += ":" + usr.id.toString()
      }
      ws.send(message);
    }
  }, 1000 * 58);

  function event() {
    var callbacks = $.Callbacks();
    return {
      subscribe: function (componentCtrl, fn) {
        if (fn) {
          if (!componentCtrl.unsubscribeOnDestroy) {
            componentCtrl.unsubscribeOnDestroy = [];
          }

          componentCtrl.unsubscribeOnDestroy.push({ callbacks: callbacks, fn: fn });

          componentCtrl.$onDestroy = function () {
            componentCtrl.unsubscribeOnDestroy.forEach(function(subscription) {
              subscription.callbacks.remove(subscription.fn);
            });
          };
        } else {
          fn = componentCtrl;
        }
        callbacks.add(fn);
      },
      unsubscribe: callbacks.remove,
      publish: callbacks.fire
    };
  }

  function connect() {
    ws.onopen = function() {};
    ws.onmessage = function(e) {};
    ws.onclose = function(e) {
      setTimeout(function() {
        connect();
      }, 1000);
    };
  
    ws.onerror = function(err) {
      console.error('Socket encountered error: ', err.message, 'Closing socket');
      ws.close();
    };
  }
  if (ws) connect();

  api.posts = {
    createPost: function(body) {
      return $http({method: 'POST', url: apiBase + '/posts', data: body, headers: headers})
    },
    uploadPostImage: function(body) {
      return $http({method: 'POST', url: apiBase + '/uploadPostImage', data: body, headers: headers})
    },
    get: function(postId) {
      return $http({method: 'GET', url: apiBase + '/post/' + postId, headers: headers})
    },
    getComments: function(postId) {
      return $http({method: 'GET', url: apiBase + '/post/comments/' + postId, headers: headers})
    },
    likePost: function(postId) {
      return $http({method: 'POST', url: apiBase + '/like/' + postId, headers: headers})
    },
    unlikePost: function(postId) {
      return $http({method: 'POST', url: apiBase + '/unlike/' + postId, headers: headers})
    },
    repost: function(postId) {
      return $http({method: 'POST', url: apiBase + '/repost/' + postId, headers: headers})
    },
    unrepost: function(postId) {
      return $http({method: 'POST', url: apiBase + '/unrepost/' + postId, headers: headers})
    }
  }

  api.timelines = {
    getHome: function(params) {
      var reqUrl = "/timeline/home";
      var querStr = "?"
      if (params) {
        var keys = Object.keys(params);

        for(var i = 0; i < keys.length; i++) {
          querStr += keys[i] + "=" + params[keys[i]];
          if (i < keys.length-1) querStr += "&";
        }
        reqUrl += querStr;
      }
      return $http({method: 'GET', url: apiBase + reqUrl, headers: headers});
    }
  }

  function index(obj, i) {
    return obj[i];
  }
  if (ws) {
    ws.onmessage = function (event) {
      if (event.data == "pong") return;
      var data = JSON.parse(event.data);
      if (!data.method) {
        throw 'Malformed event data received through WebSocket. Received event data object was: ' + data;
      } else if (!data.method.split('.').reduce(index, api)) {
        throw 'Undefined event type received through WebSocket. Received event data object was: ' + data;
      }
      data.method.split('.').reduce(index, api).publish(data.params);
      $rootScope.$apply();
    };
  }

  return api;
});