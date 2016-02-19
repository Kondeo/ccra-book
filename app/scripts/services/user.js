angular.module('starter')
  .factory('User', ['$resource', 'CONST', function($resource, CONST) {

    return $resource(CONST.apiBase + 'users/:Id',
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
                url: CONST.apiBase + 'users/self/:token'
            }

        } );

}]);
