angular.module('starter')
.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup,
    $ionicPlatform, $timeout, $location, $state,
    $window, $ionicHistory, User, loadingSpinner,
    Notifications, Config) {

  //Platform detection
  $scope.platformIOS = ionic.Platform.isIOS() || ionic.Platform.isIPad();
  $scope.platformAndroid = ionic.Platform.isAndroid();

  $scope.clientConfig;
  $scope.setConfig = function(config){
    var client = "WEB";
    if($scope.platformIOS) client = "IOS";
    if($scope.platformAndroid) client = "ANDROID";
    $scope.clientConfig = config[client];
  }

  //Start loading
  loadingSpinner.startLoading();
  Config.get(function(data){
    //Stop loading
    loadingSpinner.stopLoading();
    $scope.setConfig(data)
  }, function(error){
    //Our custom Error Handler
    var handlers = [
        {
            status: 426,
            title: "APPLICATION UNSUPPORTED",
            text: "Your application version is no longer supported. There will likely be bugs and crashes. Please update to the newest version in the App Store.",
            callback: function(response) {
              $scope.setConfig(response.data)
            }
        },
        {
            status: 449,
            title: "Please Update",
            text: "You are running an old version of this app. Please update to the newest version in the App Store, or you may start experiencing bugs.",
            callback: function(response) {
              $scope.setConfig(response.data)
            }
        }
    ]

    //Send to the notification handler
    Notifications.error(error, handlers);
  });

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
                $scope.closeLogin();

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

                $scope.closeLogin();

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
                var monthAlerted = localStorage.getItem("monthAlerted");
                var weekAlerted = localStorage.getItem("weekAlerted");
                var admin = response.admin;
                if(subDate &&
                    !admin)

                    if((!monthAlerted &&
                    moment().add(1, 'M').isAfter(moment(subDate))) ||
                    (!weekAlerted &&
                    moment().add(6, 'd').isAfter(moment(subDate)))) {

                        //Alert the user their subscription is Ending
                        //inform user there subscription is ending
                        Notifications.show("Subscription Ending Soon!", "Please notice that your subscription shall be ending: " +
                         moment(subDate.subscription).format("dddd, MMMM Do YYYY") +
                         ". Please visit the menu, and select (Manage Subscription) to extend your subscription.");

                         //Set the alerted to true
                         //Save their subscription Date
                         localStorage.setItem("subscriptionDate", response.subscription);

                         //Check if need to flip month or week
                         if(!monthAlerted &&
                         moment().add(1, 'M').isAfter(moment(subDate))) {
                             localStorage.setItem("monthAlerted", true);
                         }
                         else localStorage.setItem("weekAlerted", true);
                }
                return true;
            },
            //Errors from request
            function(response) {

                //Handle the error with Notifications
                Notifications.error(response);
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
        }, 100);
    });

});
