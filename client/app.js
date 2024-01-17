'use strict';

angular
    .module('fssocial', [
      'ngRoute',
      'angular-loading-bar',
      'fssocial.common',
      'fssocial.sidenav',
      'fssocial.topnav',
      'fssocial.post',
      'fssocial.home'
    ])

    .config(function ($routeProvider, $locationProvider, cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = false;
      cfpLoadingBarProvider.latencyThreshold = 500;//ms
      $locationProvider.html5Mode(true);
      $routeProvider
          .otherwise({
            redirectTo: '/'
          });
    })

    .run(function ($location, $rootScope, $window, $route, api, $compile) {
      var common = $rootScope.common = $rootScope.common || {
        active: {},
        isCreatingPost: false,
        isLoading: true,
        newPostText: "",
        maxPostLength: 240,
        createNewPost: function() {
          common.newPostText = "";
          common.isCreatingPost = true;
        },
        discardNewPost: function() {
          common.newPostText = "";
          common.isCreatingPost = false;
        },
        logout: function () {
          delete $window.sessionStorage.token;
          delete $window.sessionStorage.user;
          delete $window.localStorage.token;
          delete $window.localStorage.user;
          $window.location.replace('/login.html');
        },
        goToRoute: function(route) {
          $window.location.replace(route);
        },
        makeUnique: function(array, propertyName) {
          return array.filter((e, i) => array.findIndex(a => a[propertyName].toString() === e[propertyName].toString()) === i);
        },
        processPostBody: function(post) {
          var insert = "<span>" + post.body + "</span>"
          var elmId = "post-body-" + post._id
          var elm = document.getElementById(elmId);
          if (elm) {
            elm.innerHTML = "";
            var rootscpCmpl = ($compile(insert)($rootScope));
            elm.append(rootscpCmpl[0]);
          }
        },
        getProfilePicture: function(userId) {
          var output = "../../images/default.png";
          // TODO Swap Default with User pfp if exists.
          return output;
        },
        clickPost: function(postId, returnUrl = null) {
          var routeTmp = "/post/" + postId;
          routeTmp += returnUrl != null ? "?returnUrl=" + returnUrl : "";
          $window.location.replace(routeTmp);
        },
        clickProfile: function(profileId, returnUrl = null) {
          var routeTmp = "/profile/" + profileId;
          routeTmp += returnUrl != null ? "?returnUrl=" + returnUrl : "";
          $window.location.replace(routeTmp);
        }
      };

      if ( ($window.sessionStorage.user || $window.localStorage.user) != undefined ) {
        common.user = JSON.parse($window.sessionStorage.user || $window.localStorage.user)
        common.token = ($window.sessionStorage.token || $window.localStorage.token)
      }
      common.isLoading = false;
      $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.common.title = current.title;
        $rootScope.common.active[current.menuItem] = 'active';
        $rootScope.common.menuItem = current.menuItem;
        if (previous) {
          delete $rootScope.common.active[previous.menuItem];
        }
      });
    });