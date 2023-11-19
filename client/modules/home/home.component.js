'use strict';

angular.module('fssocial.home').component('home', {
  templateUrl: 'modules/home/home.template.html',
  controller: function ($rootScope, api, $routeParams) {
    var ctrl = this;
    ctrl.user = $rootScope.common.user;
    if (!ctrl.user) {
      window.location.href = "/login.html"
    }
    ctrl.posts = [];
    ctrl.newpostText = "";
    ctrl.timelineQuery = {
      skip: 0,
      limit: 25   
    }

    ctrl.loadTimeline = function() {
      api.timelines.getHome(ctrl.timelineQuery).then(function success(res) {
        ctrl.posts = res.data;
        console.log("ctrl.posts: ", ctrl.posts)

        angular.element(document).ready(function () {
          ctrl.posts.forEach(function(post) { $rootScope.common.processPostBody(post) });
          _.defer(function(){$rootScope.$apply();});
        });
      });
    }

    ctrl.createNewPost = function() {
      var obj = {
        from: ctrl.user.id,
        body: ctrl.newpostText
      }
      api.posts.createPost(obj).then(function success(res) {
        if (res.status == 200) {
          var newPostId = res.data.id;
          console.log("newPostId: ", newPostId)
          ctrl.posts = [];
          ctrl.newpostText = "";
          ctrl.loadTimeline();
        }
      });
    }

    ctrl.genRelativeTimestamp = function(createdAt) {
      var now = Date.now();
      var secDif = (now - createdAt) / 1000;

      if (secDif <= 59) {
        return Math.round(secDif) + "s";
      }

      var minDiff = secDif / 60;

      if (minDiff <= 59) {
        return Math.round(minDiff) + "m";
      }

      var hrDiff = minDiff / 60;
      if (hrDiff <= 23) {
        return Math.round(hrDiff) + "h";
      }

      var dayDiff = hrDiff / 24;
      return Math.round(dayDiff) + "d";
    }

    ctrl.likePost = function(post) {
      api.posts.likePost(post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          post.likes++;
          post.hasLiked = true;
        }
      });
    }

    ctrl.unlikePost = function(post) {
      api.posts.unlikePost(post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          post.likes--;
          post.hasLiked = false;
        }
      });
    }

    ctrl.loadTimeline();
    homeController = ctrl;
  }
});

var homeController;