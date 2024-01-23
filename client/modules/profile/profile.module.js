'use strict';

angular
    .module('fssocial.profile', [
      'ngRoute',
      'monospaced.elastic',
      'fssocial.common'
    ])
    .config(function ($routeProvider) {
      $routeProvider
          .when('/profile/:id', {
            title: 'FS Social - Profile',
            template: '<profile></profile>',
            menuItem: 'profile'
          });
    });