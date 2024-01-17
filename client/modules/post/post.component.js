'use strict';

angular.module('fssocial.post').component('post', {
  templateUrl: 'modules/post/post.template.html',
  controller: function ($rootScope, api, $routeParams) {
    var ctrl = this;
    ctrl.user = $rootScope.common.user;
    if (!ctrl.user) {
      window.location.href = "/login.html"
    }

    console.log("$routeParams: ", $routeParams)

    api.posts.get($routeParams.id).then(function success(res) {
      if (res.status == 200) {
        ctrl.post = res.data;
        console.log("ctrl.post: ", ctrl.post)
      }
    });
    
    postController = ctrl;
  }
});

var postController;