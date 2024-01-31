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
    ctrl.maxPostLength = $rootScope.common.maxPostLength;

    ctrl.loadTimeline = function() {
      api.timelines.getHome(ctrl.timelineQuery).then(function success(res) {
        ctrl.posts = res.data;
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
      if (ctrl.newPostImage) {
        obj.image = ctrl.newPostImage;
        obj.imageCompressed = ctrl.newPostImageCompressed;
      }
      api.posts.createPost(obj).then(function success(res) {
        if (res.status == 200) {
          ctrl.posts = [];
          ctrl.newpostText = "";
          ctrl.loadTimeline();
          ctrl.removePostImage();
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

    $( document ).ready(function() {
      $('input[name=postImageInput]').change(function(ev) {
        var tmp = document.getElementById('postImageInput').files[0];
        const reader = new FileReader();
        reader.readAsDataURL(tmp);
        reader.onload = readerEvent => {
          const b64 = reader.result.substring(reader.result.indexOf(",") + 1);
          ctrl.uploadImg = b64;
          api.posts.uploadPostImage({image: ctrl.uploadImg}).then(function(res) {
            if (res.status == 200 || res.status == 201) {
              ctrl.newPostImage = res.data.filename;
              ctrl.newPostImageCompressed = res.data.compressed;
            }
          })
        }
      });
    });

    ctrl.getPictureSrc = function() {
      var path = "/uploads/posts/" + ctrl.newPostImageCompressed;
      return path;
    }

    ctrl.getPostPictureSrc = function(post) {
      return $rootScope.common.getPostPictureSrc(post, true);
    }

    ctrl.removePostImage = function() {
      delete ctrl.newPostImage;
      delete ctrl.newPostImageCompressed;
    }

    ctrl.clickProfile = function() {
      $rootScope.common.getProfilePicture(ctrl.post.from);
    }

    ctrl.loadTimeline();
    homeController = ctrl;
  }
});

var homeController;