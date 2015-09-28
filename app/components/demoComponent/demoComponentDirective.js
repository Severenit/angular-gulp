(function() {
  'use strict';
  angular
      .module('app.demoComponent', [])
      .directive('demoComponent', demoComponentFn);

  // @ngInject
  function demoComponentFn() {
    return {
      restrict: 'A',
      templateUrl: 'components/demoComponent/demoComponent.html'
    };
  }
})();