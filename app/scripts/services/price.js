angular.module('starter')
.factory('Price', ['$resource', function($resource) {

  return $resource(api_base + 'prices',
      { }, {

          get: {
              method: 'GET',
              params: {}
          }
      } );

}]);
