angular.module('starter')
.controller('PageEditCtrl', function($scope, $stateParams,
    Page, $location, $state,
    $ionicHistory, $ionicScrollDelegate,
    loadingSpinner) {

    //Get the page number and cookie
    $scope.pagenum = $stateParams.page;

    //Initialize the page contents
    $scope.pagecontents = "";

    $scope.pageInit = function() {

        //If we are not an admin go back
        if(!localStorage.getItem("admin")) $ionicHistory.goBack();

        var cookie = localStorage.getItem("session_token");

        var payload = {
            number: $scope.pagenum,
            token: cookie
        };

        //Start loading
        loadingSpinner.startLoading();

        Page.get(payload, function(data) {

            //Stop loading
            loadingSpinner.stopLoading();

            //Then display the page
            $scope.pagecontents = data.content;
            $scope.pageNumber = data.number;
            $scope.pageNextNumber = data.nextnumber;

            //Set our current error to none
            $scope.errors[0] = -1;
        },
        //Errors
        function(response) {

            //Stop loading
            loadingSpinner.stopLoading();

            if (response.status == 401) {
               //Handle 401 error code

               //Pull up the login modal
               $scope.login();

               //Show an error
               $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!")
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
    }

    //Call the page init
    $scope.pageInit();

   //Function to save the edited page
   $scope.savePage = function() {

       //Start loading
       loadingSpinner.startLoading();

       //Grab our sessiontoken
       var cookie = localStorage.getItem("session_token");

       //Our payload
       var payload = {
           token: cookie,
           content: $scope.pagecontents,
           number: $scope.pageNumber,
           nextNumber: $scope.pageNextNumber,
       }

       Page.update(payload, function(response){

           //Handle succes here

           //Stop loading
           loadingSpinner.stopLoading();

           //Go back to the page views
           $ionicHistory.nextViewOptions({
               disableBack: true
           });
           //Second param is state params
           $state.go('app.single', {"page": $scope.pageNumber});

       }, function(response){

           //Stop loading
           loadingSpinner.stopLoading();

           //handle errors here
           if (response.status == 401) {
              //Handle 401 error code

              //Pull up the login modal
              $scope.login();

              //Show an error
              $scope.showAlert("Session Error", "Session Token not found, invalidated, or you are not an administrator, please log in!")
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
   }
});
