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
    ctrl.parentTimestamp = "";
    ctrl.commentText = "";
    ctrl.isCommenting = $routeParams.isCommenting ? true : false;
    ctrl.comments = [];
    ctrl.maxPostLength = $rootScope.common.maxPostLength;
    ctrl.commentsLoaded = false;

    api.posts.get(ctrl.postId).then(function success(res) {
      if (res.status == 200) {
        ctrl.post = res.data;

        if (ctrl.post.isReply == true) {
          api.posts.get(ctrl.post.parentId).then(function success(res2) {
            if (res2.status == 200) {
              ctrl.parentPost = res2.data;
              console.log("ctrl.parentPost: ", ctrl.parentPost)

              angular.element(document).ready(function () {
                $rootScope.common.processPostBody(ctrl.parentPost);
                ctrl.parentTimestamp = ctrl.genPrettyTime(ctrl.parentPost.createdAt);
                _.defer(function(){$rootScope.$apply();});
              });
            }
          });
        }

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

    ctrl.genPrettyTime = function(ts = null) {
      if (!ts) ts = ctrl.post.createdAt;
      var output = "";
      var dateObj = new Date(ts);

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
          ctrl.commentsLoaded = true;
          console.log("ctrl.comments: ", ctrl.comments)
          angular.element(document).ready(function () {
            ctrl.comments.forEach(function(post) { $rootScope.common.processPostBody(post) });
            _.defer(function(){$rootScope.$apply();});
          });
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

    ctrl.likeComment = function(post) {
      api.posts.likePost(post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          post.likes++;
          post.hasLiked = true;
        }
      });
    }

    ctrl.unlikeComment = function(post) {
      api.posts.unlikePost(post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          post.likes--;
          post.hasLiked = false;
        }
      });
    }

    ctrl.repostComment = function(post) {
      api.posts.repost(post._id).then(function(res) {
        if (res.status == 200 || res.status == 201) {
          post.reposts++;
          post.hasRepost = true;
        }
      });
    }

    ctrl.unrepostComment = function(post) {
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
    
    postController = ctrl;
  }
});

var postController;