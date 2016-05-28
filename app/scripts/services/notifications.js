angular.module('starter')
.service('Notifications', function($ionicPopup, $ionicModal,
    loadingSpinner, $ionicHistory, $state,
    LoginModal) {

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
                        if(handlers[i].callback) showAlert(handlers[i].title, handlers[i].text, handlers[i].callback(response));
                        else showAlert(handlers[i].title, handlers[i].text);
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
                   showAlert("Sign In Required", "For security purposes, please sign in again.");

                   //Show the login Modal
                   LoginModal.show();
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
                   Notifications.show("Subscription Ended", "To continue using the app, you will need to add a subscription.");
               }
               else if (response.status == 404) {
                 //404 error

                 //Show alert
                 showAlert("Not Found", "We had a problem with our servers, please try again in a few minutes. If this continues, please contact our development team.");
               }
               else if (response.status == -1) {
                 //No Internet Connection

                 //Show alert
                 showAlert("No Connection", "Internet Connection is required to use this app. Please connect to the internet with your device, and restart the app.");
               }
               else if (response.status == 500) {
                 //500 error

                 //Show alert
                 showAlert("Server Error", "Your connection may be bad, or the server is being problematic. Please re-open the app, or try again later.");
               }
               else {
                   //General Error

                   //An unexpected error has occured
                   //Show alert
                   showAlert("Error Status: " + response.status, "Unexpected Error. Please re-open the app, or try again later!");
               }
            }
        }

    };
});
