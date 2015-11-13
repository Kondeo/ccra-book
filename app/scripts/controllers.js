angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup, $ionicPlatform, $timeout, $location, $window, Book) {
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
  $ionicModal.fromTemplateUrl('templates/login.html', {
    backdropClickToClose: false,
    id: 1,
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Create the go to page modal that we will use later
  $ionicModal.fromTemplateUrl('templates/gotopage.html', {
    id: 2,
    scope: $scope
  }).then(function(modal) {
    $scope.gotomodal = modal;
  });

  //Alert popup we shall use instead of alerts
  $scope.showAlert = function(aTitle, aText) {
   var alertPopup = $ionicPopup.alert({
     title: aTitle,
     template: aText
   });
   alertPopup.then(function(res) {
     //Do nothing here
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

    $scope.loginFinish = Book.login($scope.loginData, function() {
        //Determine response from server
        if (!$scope.loginFinish.result) {
            $scope.showAlert("Alert!", "Sorry, that isn't the correct username and password.");
        } else {
            //Store the token from the server for future use
            localStorage.setItem("session_token", $scope.loginFinish.result.session_token);
            $scope.closeLogin();
            //Reload the page
            $window.location.reload(true);
        }
    });
  };

  // Perform the find page
  $scope.goToPageNum = function() {
    //Go to the desired url
    $scope.temp = 'app/page/' + $scope.page.number;
    $location.path($scope.temp);

    //Now close the modal
    $scope.gotomodal.hide();
  };

  // go to the listing
  $scope.listing = function() {
    //Go to the desired url
    $location.path('app/listing');
  };

  //Function to check if we are logged in
  $scope.loggedIn = function()
  {
    //attempt to grab our cookie
    var cookie = localStorage.getItem("session_token");
    if(cookie != "")
    {
      return true;
    }
    else
    {
      return false;
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

})

.controller('IndexCtrl', function($scope) {
  $scope.indexes = [
    { title: 'Index list will be here', page: 1, id: 1, indented: 0},
    { title: 'Index item 2', page: 1, id: 1, indented: 0}
  ];
})

.controller('ListingCtrl', function($scope) {
  $scope.indexes = [
    { title: 'Search results here', page: 1, id: 1},
    { title: 'Search result 2', page: 1, id: 2},
  ];
})

.controller('RegisterCtrl', function($scope, $location, Book) {
    // Form data for the register controller
    $scope.registerData = {};

    // Perform the login action when the user submits the login form
    $scope.doRegister = function() {

        //Check for empty fields
        if($scope.registerData.email == null ||
        $scope.registerData.username == null ||
        $scope.registerData.password == null ||
        $scope.registerData.confirmPassword == null)
        {
            $scope.showAlert("Alert!", "Please complete all fields!");
        }
        //Check for non matching passwords
        else if($scope.registerData.password != $scope.registerData.confirmPassword)
        {
            $scope.showAlert("Alert!", "The passwords do not match!");
        }
        //Check email
        else if($scope.registerData.email.indexOf("@") == -1)
        {
            $scope.showAlert("Alert!", "Please enter a valid E-mail Adress!");
        }
        //Send to backend
        else
        {

            $scope.registerFinish = Book.register($scope.registerData, function() {
                //Determine response from server
                if ($scope.registerFinish.error) {
                    if($scope.registerFinish.error.errorid == '22')
                    {
                        $scope.showAlert("Alert!", "Sorry, that username already exists.");
                    }
                    else if($scope.registerFinish.error.errorid == '23')
                    {
                        $scope.showAlert("Alert!", "Sorry, you have not purchased the software.");
                    }
                }
                else
                {
                    //Store the token from the server for future use
                    localStorage.setItem("session_token", $scope.registerFinish.result.session_token);
                    $location.path("#/");
                }
            });
        }
    }

})

.controller('PageCtrl', function($scope, $stateParams, Book, $location, $http, $sce, $state, $ionicHistory, $ionicScrollDelegate) {
    $scope.pagenum = $stateParams.page;
    var cookie = localStorage.getItem("session_token");
    $http.get('http://localhost:3000/pages/' + $stateParams.page).
      success(function(data, status, headers, config) {
        // this callback will be called asynchronously
        // when the response is available
        //Check for any errors
        if(data.error)
        {
            if(data.error.errorid == '12')
            {
                $scope.showAlert("Alert!", "Session token is no longer valid, please login!");

                //Set our current error
                $scope.errors[0] = 12;

                $scope.login();
            }
        }
        else
        {
            //Then display the page
            $scope.pagecontents = data.pageContent;
            $scope.trustedHtml = $sce.trustAsHtml($scope.pagecontents);

            //Set our current error to none
            $scope.errors[0] = -1;
        }
      }).
      error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

    $scope.goToNext = function(){
        var temp = parseInt($stateParams.page) + 1;
        console.log(temp)
        temp = 'app/page/' + temp;

        $location.path(temp);
    }

    $scope.goToPrev = function(){
        $ionicHistory.goBack();
    }

    $scope.scrollBottom = function(){
        $ionicScrollDelegate.scrollBottom(true);
    }

    $scope.scrollTop = function(){
        $ionicScrollDelegate.scrollTop(true);
    }
})

.controller('SettingsCtrl', function($scope) {


    $scope.saveSettings = function(){
        localStorage.setItem("easyReading", $scope.settings.easyReading);
    }

});
