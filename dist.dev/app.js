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
angular.module('healthyGulpAngularApp')

  .directive('demoComponent', [function() {
    return {
      restrict: 'A',
      templateUrl: 'components/demoComponent/demoComponent.html'
    };
  }]);