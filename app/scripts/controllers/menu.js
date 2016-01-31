angular.module('starter')
.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup,
    $ionicPlatform, $timeout, $location, $state,
    $window, $ionicHistory, User, loadingSpinner,
    ionicAlert) {

  //Platform detection
  $scope.platformIOS = ionic.Platform.isIOS() || ionic.Platform.isIPad();
  $scope.platformAndroid = ionic.Platform.isAndroid();

  $scope.settings = {};
  $scope.settings.easyReading = localStorage.getItem("easyReading") === "true";

  // Form data for the login modal
  $scope.loginData = {};

  //Form data for the go to page
  $scope.page = {};

  //Variable to catch our current errors
  $scope.errors = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/modals/login.html', {
    backdropClickToClose: false,
    id: 1,
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Create the go to page modal that we will use later
  $ionicModal.fromTemplateUrl('templates/modals/gotopage.html', {
    id: 2,
    scope: $scope
  }).then(function(modal) {
    $scope.gotomodal = modal;
  });

  //Alert popup we shall use instead of alerts
  $scope.showAlert = function(aTitle, aText, callback) {
   var alertPopup = $ionicPopup.alert({
     title: aTitle,
     template: aText
   });
   alertPopup.then(function(res) {
     if(callback) callback();
   });
 };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Open the login modal
  $scope.goToPage = function() {
    $scope.gotomodal.show();
  };

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Triggered in the go to modal to close it
 $scope.closeGoTo = function() {
   $scope.gotomodal.hide();
 };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    //Start Loading
    loadingSpinner.startLoading();

    User.login($scope.loginData, function(data) {

        //Hide red error text, if it was shown
        $scope.authError = false;

        //Stop Loading
        loadingSpinner.stopLoading();

        //Store the token from the server for future use
        localStorage.setItem("session_token", data.token);

        //Store if they are an administrator
        if(data.admin) localStorage.setItem("admin", true);
        else localStorage.removeItem("admin");

        //Set validated to true
        sessionStorage.setItem("session_validated", true);

        //Store the user subscription notice
        localStorage.setItem("subscriptionDate", data.subscription);

        //Inform the user
        //Show an alert
        if(!data.admin && moment().add(6, 'd').isAfter(moment(data.subscription))) {

            //inform user there subscription is ending
            $scope.showAlert("Login Success, Subscription Ending Soon!", "Please notice that your subscription shall be ending: " +
             moment(data.subscription).format("dddd, MMMM Do YYYY") +
             ". Please visit the menu, and select (Manage Subscription) to extend your subscription. The Page will now reload...", function() {

                //They have been alerted
                sessionStorage.setItem("alerted", true);

                //Alert Call back
                $scope.closeLogin();

                //Reload the page
                $window.location.reload(true);
            });
        }
        else {

            //Show normal login alert
            $scope.showAlert("Login Success!", "The Page will now reload...", function() {

                //Alert Call back

                $scope.closeLogin();

                //Reload the page
                $window.location.reload(true);
            });
        }
    },
    //Errors
    function(response) {

        //Stop Loading
        loadingSpinner.stopLoading();

        if (response.status == 401 ||
        response.status == 412) {
           //Handle 401 error code

           //Show an error
           $scope.showAlert("Login Failed", "Email or password was incorrect!");

           //Show red error text
           $scope.authError = true;
       }
       else if(response.status == 402) {
           //Handle 402 Error
           //Payment Requried

           //Move them back to the index, no history
           $ionicHistory.nextViewOptions({
               disableBack: true
           });
           $state.go('app.register');

           //Show alert
           $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
       }
       else if (response.status == 500) {
         // Handle 500 error code

         //Show an error
         $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
       }
       else {
           //Handle General Error

           //An unexpected error has occured, log into console
           //Show an error
           $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
       }
    });
  };

  // Perform the find page
  $scope.goToPageNum = function() {
    //Go to the desired url
    if($scope.page.number) {
        $scope.temp = 'app/page/' + $scope.page.number;
        $location.path($scope.temp);

        //Now close the modal
        $scope.gotomodal.hide();
    }
    else ionicAlert.show("Invalid Page", "Sorry the page is invalid, or does not exist...");
  };

  // go to the listing
  $scope.listing = function() {
    //Go to the desired url
    $location.path('app/listing');
  };

  sessionStorage.setItem('key', 'value');

  //Function to check if we are logged in
  $scope.loggedIn = function()
  {
    //attempt to grab our cookie
    var token = localStorage.getItem("session_token");
    var validated = sessionStorage.getItem("session_validated");
    if(!token) {
      return false;
    } else {
        if(validated){
            return true;
        } else {

            //Set validated to true until proven false;
            sessionStorage.setItem("session_validated", true);

            //Start Loading
            loadingSpinner.startLoading();

            User.get({token: token}, function(response){

                //Stop Loading
                loadingSpinner.stopLoading();

                //Store if they are an administrator
                if(response.admin) localStorage.setItem("admin", true);
                else localStorage.removeItem("admin");

                //Also Check if our subscription is ending
                var subDate = localStorage.getItem("subscriptionDate");
                var alerted = localStorage.getItem("alerted");
                var admin = response.admin;
                if(subDate &&
                    !admin &&
                    !alerted &&
                    moment().add(6, 'd').isAfter(moment(subDate))) {

                        //Alert the user their subscription is Ending
                        //inform user there subscription is ending
                        $scope.showAlert("Subscription Ending Soon!", "Please notice that your subscription shall be ending: " +
                         moment(subDate.subscription).format("dddd, MMMM Do YYYY") +
                         ". Please visit the menu, and select (Manage Subscription) to extend your subscription.");

                         //Set the alerted to true
                         //Save their subscription Date
                         localStorage.setItem("subscriptionDate", response.subscription);
                         localStorage.setItem("alerted", true);
                }
                return true;
            },
            //Errors from request
            function(response) {

                //Stop Loading
                loadingSpinner.stopLoading();

                //Proven False
                sessionStorage.setItem("session_validated", false);

                if (response.status == 401) {
                   //Handle 401 error code

                   //Pull up the login modal
                   $scope.login();

                   //Delete the token
                   localStorage.removeItem("session_token");

                   //Show an error
                   $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!");
               }
               else if(response.status == 402) {
                   //Handle 402 Error
                   //Payment Requried

                   //Delete the token
                   localStorage.removeItem("session_token");

                   //Move them back to the index, no history
                   $ionicHistory.nextViewOptions({
                       disableBack: true
                   });
                   $state.go('app.register');

                   //Show alert
                   $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
               }
               else if (response.status == 404) {
                 // Handle 404 error code

                 //Delete the token
                 localStorage.removeItem("session_token");

                 //Show an error
                 $scope.showAlert("No Connection!", "Internet Connection is required to use this app. Please connect to the internet with your device, and restart the app!");
               }
               else if (response.status == 500) {
                 // Handle 500 error code

                 //Show an error
                 $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
               }
               else {
                   //Handle General Error

                   //An unexpected error has occured, log into console
                   //Show an error
                   $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
               }
           });
        }
    }
  }

  // at the bottom of your controller
  //Check if we are logged in, if not, force the login popup
    $scope.init = function () {
        if(!$scope.loggedIn() && $location.path() != "/app/register")
        {
            $scope.modal.show();
        }
    };

    //Load function on page load
    $ionicPlatform.ready(function(){
        //timeout for a second then check if we are logged in
        $timeout( function()
        {
            $scope.init();
        }, 1000);
    });

});
