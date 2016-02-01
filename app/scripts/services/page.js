angular.module('starter')
.factory('Page', ['$resource', function($resource) {

  return $resource(api_base + 'pages/:number',
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
              url: api_base + 'pages/query/:query'
          }

      } );

}]);
