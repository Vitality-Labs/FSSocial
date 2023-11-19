'use strict';

angular.module('fssocial.topnav').component('topnav', {
  templateUrl: 'modules/topnav/topnav.template.html',
  controller: function ($rootScope, api, $routeParams) {
    var ctrl = this;
    ctrl.user = $rootScope.common.user;
  }
});