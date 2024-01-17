'use strict';

angular.module('fssocial.post').component('post', {
  templateUrl: 'modules/post/post.template.html',
  controller: function ($rootScope, api, $routeParams) {
    var ctrl = this;
    ctrl.user = $rootScope.common.user;
    ctrl.postId = $routeParams.id;
    ctrl.returnUrl = $routeParams.returnUrl;
    if (!ctrl.user) {
      window.location.href = "/login.html"
    }
    ctrl.timestamp = "";
    ctrl.commentText = "";
    ctrl.isCommenting = $routeParams.isCommenting ? true : false;
    ctrl.comments = [];
    ctrl.maxPostLength = $rootScope.common.maxPostLength;

    api.posts.get(ctrl.postId).then(function success(res) {
      if (res.status == 200) {
        ctrl.post = res.data;
        angular.element(document).ready(function () {
          $rootScope.common.processPostBody(ctrl.post);
          ctrl.timestamp = ctrl.genPrettyTime();
          _.defer(function(){$rootScope.$apply();});
        });
      }
    });
    loadComments();

    ctrl.clickProfile = function() {
      $rootScope.common.getProfilePicture(ctrl.post.from);
    }

    ctrl.genPrettyTime = function() {
      var output = "";
      var dateObj = new Date(ctrl.post.createdAt);

      output += (dateObj.getMonth() + 1) + "/";
      output += dateObj.getDate() + "/";
      output += dateObj.getFullYear() + " ";

      var hrs = dateObj.getHours();
      var suffix = "AM";
      if (hrs > 12) {
        suffix = "PM";
        hrs = hrs - 12;
      }

      var min = dateObj.getMinutes().toString();
      if (min.length == 1) {
        min = "0" + min;
      }

      output += hrs + ":" + min + " " + suffix;
      return output;
    }

    ctrl.likePost = function() {
      api.posts.likePost(ctrl.post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          ctrl.post.likes++;
          ctrl.post.hasLiked = true;
        }
      });
    }

    ctrl.unlikePost = function() {
      api.posts.unlikePost(ctrl.post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          ctrl.post.likes--;
          ctrl.post.hasLiked = false;
        }
      });
    }

    ctrl.repost = function() {
      api.posts.repost(ctrl.post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          ctrl.post.reposts++;
          ctrl.post.hasRepost = true;
        }
      });
    }

    ctrl.unrepost = function() {
      api.posts.unrepost(ctrl.post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          ctrl.post.reposts--;
          ctrl.post.hasRepost = false;
        }
      });
    }

    ctrl.createReplyPost = function() {
      var obj = {
        from: ctrl.user.id,
        body: ctrl.commentText,
        isReply: true,
        parentId: ctrl.post._id,
        parentFrom: ctrl.post.from
      }
      api.posts.createPost(obj).then(function success(res) {
        if (res.status == 200) {
          ctrl.commentText = "";
          loadComments();
        }
      });
    }

    function loadComments() {
      api.posts.getComments(ctrl.postId).then(function success(res) {
        if (res.status == 200) {
          ctrl.comments = res.data;
          console.log("ctrl.comments: ", ctrl.comments)
          angular.element(document).ready(function () {
            ctrl.comments.forEach(function(post) { $rootScope.common.processPostBody(post) });
            _.defer(function(){$rootScope.$apply();});
          });
        }
      });
    }
    
    postController = ctrl;
  }
});

var postController;