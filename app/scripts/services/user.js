angular.module('starter')
  .factory('User', ['$resource', function($resource) {

    return $resource(api_base + 'users/:Id',
        { Id: '@Id' }, {
            register: {
                method: 'POST',
                params: { Id: 'register' },
                isArray: false
            },

            login: {
                method: 'POST',
                params: { Id: 'login' },
                isArray: false
            },

            renew: {
                method: 'POST',
                params: { Id: 'renew' },
                isArray: false
            },

            get: {
                method: 'GET',
                params: { token: 'token'},
                url: api_base + 'users/self/:token'
            }

        } );

}]);
