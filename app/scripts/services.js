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

}])

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

}])

.factory('Price', ['$resource', function($resource) {

  return $resource(api_base + 'prices',
      { }, {

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
            return true;
        },

        stopLoading: function() {

            //First, make the body interactable again
            document.body.class = document.body.class.replace(" noTouch", "");

            loading = false;
            return false;
        }
    };
})

.service('ionicAlert', function($ionicPopup, $ionicModal,
    loadingSpinner, $ionicHistory, $state) {

    //Show an alert to the user
    function showAlert(alertTitle, alertText, callback) {

        //initialize alert with passed params
        var aPopup = $ionicPopup.alert({
             title: alertTitle,
             template: alertText
           });
           aPopup.then(function(res) {
             if(callback) callback();
           });
       }

    return {

        //General Alert
        show: function(alertTitle, alertText, callback) {

            //Simply call the helper function
            showAlert(alertTitle, alertText, callback);
        },

        /*
        Handler for multiple error statuses
        params: response = the actual
        error responded by http,
        handlers are
        an array of statuses and callbacks to
        override the default responses
        examples: [{status: 201, title: "success", text: "good response", callbackSuccess},
        {status: 402,  title: "payment required", text: "please pay!", callbackPayment}];
        */
        error: function(response, handlers) {

            //Stop loading, if we are loading
            loadingSpinner.stopLoading();

            //Our status that we are handling
            var status = -1;

            //Search through our response handlers if we got a specific
            //error we wanted to Handle
            if(handlers) {
                for(var i = 0; i < handlers.length; i++) {

                    //Check if our response Handler is for our status
                    if(response.status == handlers[i].status) {

                        //Make the handled status this status
                        status = response.status;

                        //Create the alert
                        showAlert(handlers[i].title, handlers[i].text, handlers[i].callback())
                    }
                }
            }

            //Check if we handled any statuses, if we did not
            //Go through default error handling
            if(status < 0) {

                if (response.status == 401) {
                   //401 error

                   //Delete the token
                   localStorage.removeItem("session_token");

                   //Show an alert
                   showAlert("Session Error", "Session not found or invalidated, please log in.");
               }
               else if(response.status == 402) {
                   //402 Error
                   //Payment Requried

                   //Move them back to the index, no history
                   $ionicHistory.nextViewOptions({
                       disableBack: true
                   });
                   $state.go('app.register');

                   //Show alert
                   $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
               }
               else if (error.status == 404) {
                 //404 error

                 //Delete the token
                 localStorage.removeItem("session_token");

                 //Show alert
                 showAlert("No Connection", "Internet Connection is required to use this app. Please connect to the internet with your device, and restart the app.");
               }
               else if (error.status == 500) {
                 //500 error

                 //Show alert
                 showAlert("Server Error", "Your connection may be bad, or the server is being problematic. Please re-open the app, or try again later.");
               }
               else {
                   //General Error

                   //An unexpected error has occured
                   //Show alert
                   showAlert("Error Status: " + error.status, "Unexpected Error. Please re-open the app, or try again later!");
               }
            }
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
