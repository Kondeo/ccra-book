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

    //Reset interface toggle
    $scope.reset = false;

    $scope.loading = loadingSpinner;

    $scope.submitAuth = function(){
        if($scope.reset){
            $scope.requestReset();
        } else {
            $scope.doLogin();
        }
    }

    $scope.requestReset = function(){
        loadingSpinner.startLoading();
        var payload = {
            email: $scope.loginData.email
        }
        User.forgot(payload, function(res){
            loadingSpinner.stopLoading();
            Notifications.show("Email Sent", "We have sent a reset link to the email you provided. Please use that to reset your account password.");
        }, function(err){
            //Create our handlers for errors
            var handlers = [
                {
                    status: 406,
                    title: "Email Invalid",
                    text: "The email you entered cannot be understood. Please check your formatting.",
                    callback: function() {

                        //Show red error text
                        $scope.authError = true;
                    }
                },
                {
                    status: 404,
                    title: "Account Not Found",
                    text: "We cannot find any account with that email address in our system. Please try a different email, or register a new account.",
                    callback: function() {

                        //Show red error text
                        $scope.authError = true;
                    }
                }
            ];

            Notifications.error(response, handlers);
        })
    }

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
        if(!data.admin && moment().add(6, 'd').isAfter(moment(data.subscription)) && !data.subscriptionId) {

            //inform user there subscription is ending
            Notifications.show("Not Subscribed to AutoRenew!", "You don't have an active card in your subscription settings. Please notice that your current subscription shall be ending: " +
             moment(data.subscription).format("dddd, MMMM Do YYYY") +
             ". Please visit the menu, and select (Manage Subscription) to add a card.", function() {

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
            Notifications.show("Login Successful", "The Page will now reload...");

            //Wait a slight second to show the message
            $timeout(function () {

                //Alert Call back
                LoginModal.hide();

                //Reload the page
                $window.location.reload(true);
            }, 200);
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
