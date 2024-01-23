'use strict';

angular.module('fssocial.profile').component('profile', {
  templateUrl: 'modules/profile/profile.template.html',
  controller: function ($rootScope, api, $routeParams) {
    var ctrl = this;
    ctrl.user = $rootScope.common.user;
    ctrl.profileId = $routeParams.id;
    ctrl.returnUrl = $routeParams.returnUrl;
    if (!ctrl.user) {
      window.location.href = "/login.html"
    }
    ctrl.posts = [];
    ctrl.timelineQuery = {
      skip: 0,
      limit: 25   
    }

    ctrl.loadTimeline = function() {
      api.users.getProfileData(ctrl.profileId).then(function success(res) {
        if (res.status == 200) {
          ctrl.profileData = res.data;
          console.log("ctrl.profileData: ", ctrl.profileData)
          if (ctrl.profileData) {
            api.timelines.getProfile(ctrl.profileId, ctrl.timelineQuery).then(function success(res2) {
              if (res2.status == 200) {
                ctrl.posts = res2.data;
                console.log("ctrl.posts: ", ctrl.posts)

                angular.element(document).ready(function () {
                  ctrl.posts.forEach(function(post) { $rootScope.common.processPostBody(post) });
                  _.defer(function(){$rootScope.$apply();});
                });
              }
            });
          }
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

    ctrl.repost = function(post) {
      api.posts.repost(post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          post.reposts++;
          post.hasRepost = true;
        }
      });
    }

    ctrl.unrepost = function(post) {
      api.posts.unrepost(post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          post.reposts--;
          post.hasRepost = false;
        }
      });
    }

    ctrl.getPostPictureSrc = function(post) {
      return $rootScope.common.getPostPictureSrc(post, true);
    }

    ctrl.loadTimeline();
    profileController = ctrl;
  }
});

var profileController;