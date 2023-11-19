'use strict';

angular.module('fssocial.sidenav').component('sidenav', {
  templateUrl: 'modules/sidenav/sidenav.template.html',
  controller: function ($rootScope, api, $routeParams) {
    var ctrl = this;
    ctrl.user = $rootScope.common.user;
  }
});