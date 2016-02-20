angular.module('starter')
.factory('Price', ['$resource', 'CONST', function($resource, CONST) {

  return $resource(CONST.apiBase + 'prices',
      { }, {

          get: {
              method: 'GET',
              params: {}
          }
      } );

}]);
