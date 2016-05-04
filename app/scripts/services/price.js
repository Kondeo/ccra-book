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

angular.module('starter')
.factory('Config', ['$resource', 'CONST', function($resource, CONST) {

  return $resource(CONST.apiBase + 'client',
      { }, {

          get: {
              method: 'GET',
              params: {}
          }
      } );

}]);
