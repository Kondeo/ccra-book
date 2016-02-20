angular.module('starter')
.factory('Page', ['$resource', 'CONST', function($resource, CONST) {

  return $resource(CONST.apiBase + 'pages/:number',
      { number: '@number' }, {

          get: {
              method: 'GET',
              params: {}
          },
          update: {
              method: 'PUT',
              params: {}
          },
          query: {
              method: 'GET',
              params: { query: 'query' },
              url: CONST.apiBase + 'pages/query/:query'
          }

      } );

}]);
