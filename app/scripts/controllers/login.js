angular.module('starter')
.controller('LoginCtrl', function($scope,
    LoginModal, Notifications, User,
    loadingSpinner, $ionicHistory, $state,
    User, $timeout, $window) {

    // Form data for the login modal
    $scope.loginData = {};

    //Adding out login service to scope
    //To be call in ng html
    $scope.loginService = LoginModal;

    //Should we show red text
    $scope.authError = false;

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    //Start Loading
    loadingSpinner.startLoading();

    User.login($scope.loginData, function(data) {

        //Hide red error text, if it was shown
        $scope.authError = false;

        //Store the token from the server for future use
        localStorage.setItem("session_token", data.token);

        //Store if they are an administrator
        if(data.admin) localStorage.setItem("admin", true);
        else localStorage.removeItem("admin");

        //Set validated to true
        sessionStorage.setItem("session_validated", true);

        //Store the user subscription notice
        localStorage.setItem("subscriptionDate", data.subscription);

        //Stop Loading
        loadingSpinner.stopLoading();

        //Inform the user
        //Show an alert
        if(!data.admin && moment().add(1, 'M').isAfter(moment(data.subscription))) {

            //inform user there subscription is ending
            Notifications.show("Login Success, Subscription Ending Soon!", "Please notice that your subscription shall be ending: " +
             moment(data.subscription).format("dddd, MMMM Do YYYY") +
             ". Please visit the menu, and select (Manage Subscription) to extend your subscription. The Page will now reload...", function() {

                //They have been alerted
                //Flip the variable depending if we are withing weeks
                if(!weekAlerted &&
                moment().add(6, 'd').isAfter(moment(subDate))) {
                     sessionStorage.setItem("weekAlerted", true);
                }
                else sessionStorage.setItem("monthAlerted", true);

                //Alert Call back
                LoginModal.hide();

                //Reload the page
                $window.location.reload(true);
            });
        }
        else {

            //Show normal login alert
            Notifications.show("Login Success!", "The Page will now reload...");

            //Wait a slight second to show the message
            $timeout(function () {

                //Alert Call back
                LoginModal.hide();

                //Reload the page
                $window.location.reload(true);
            }, 250);
        }
    },
    //Errors
    function(response) {

        //Create our handlers for errors
        var handlers = [
            {
                status: 401,
                title: "Login Failed",
                text: "Email or password was incorrect!",
                callback: function() {

                    //Show red error text
                    $scope.authError = true;
                }
            },
            {
                status: 412,
                title: "Login Failed",
                text: "Email or password was incorrect!",
                callback: function() {

                    //Show red error text
                    $scope.authError = true;
                }
            },
        ];

        Notifications.error(response, handlers);
    });
}

});
