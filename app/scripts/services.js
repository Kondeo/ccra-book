angular.module('starter.services', ['ngResource'])
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

}])

.factory('Page', ['$resource', function($resource) {

  return $resource(api_base + 'pages/:number',
      { number: '@number' }, {

          get: {
              method: 'GET',
              params: {}
          }

      } );

}])
.service('loadingSpinner', function() {

    //Boolean if are loading
    var loading = false;

    return {

        //Needs to be a function,
        //or else will not update across controllers
        isLoading: function() {
            if(loading) return true
            else return false
        },

        startLoading: function() {

            //First, make the body non interactable
            document.body.class = document.body.class + " noTouch";

            loading = true;
            console.log(loading);
            return true;
        },

        stopLoading: function() {

            //First, make the body interactable again
            document.body.class = document.body.class.replace(" noTouch", "");

            loading = false;
            return false;
        }
    };
});


//Quickly and painlessly gets cookies for controllers
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
}
