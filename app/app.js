(function() {
  'use strict';

  angular
    .module('app', [
      'ui.router'
    ])
    .config(appConfig);

  // @ngInject
  function appConfig($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'components/home.html'
      });
  }

})();