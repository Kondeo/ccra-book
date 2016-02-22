angular.module('starter')
.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup,
    $ionicPlatform, $timeout, $location, $state,
    $window, $ionicHistory, User, loadingSpinner,
    Notifications, LoginModal) {

  //Platform detection
  $scope.platformIOS = ionic.Platform.isIOS() || ionic.Platform.isIPad();
  $scope.platformAndroid = ionic.Platform.isAndroid();

  $scope.settings = {};
  $scope.settings.easyReading = localStorage.getItem("easyReading") === "true";

  //Form data for the go to page
  $scope.page = {};

  //Variable to catch our current errors
  $scope.errors = {};

  //Adding out login service to scope
  //To be call in ng html
  $scope.loginModal = LoginModal;

  // Create the go to page modal that we will use later
  $ionicModal.fromTemplateUrl('templates/modals/gotopage.html', {
    id: 2,
    scope: $scope
  }).then(function(modal) {
    $scope.gotomodal = modal;
  });

  // Open the login modal
  $scope.goToPage = function() {
    $scope.gotomodal.show();
  };

  // Triggered in the go to modal to close it
 $scope.closeGoTo = function() {
   $scope.gotomodal.hide();
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
            LoginModal.show();
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
