'use strict';

angular
    .module('fssocial.home', [
      'ngRoute',
      'monospaced.elastic',
      'fssocial.common'
    ])
    .config(function ($routeProvider) {
      $routeProvider
          .when('/', {
            title: 'FS Social - Home',
            template: '<home></home>',
            menuItem: 'home'
          });
    });