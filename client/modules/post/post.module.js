'use strict';

angular
    .module('fssocial.post', [
      'ngRoute',
      'monospaced.elastic',
      'fssocial.common'
    ])
    .config(function ($routeProvider) {
      $routeProvider
          .when('/post/:id', {
            title: 'FS Social - Post',
            template: '<post></post>',
            menuItem: 'post'
          });
    });