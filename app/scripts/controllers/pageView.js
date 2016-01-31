angular.module('starter')
.controller('PageCtrl', function($scope, $stateParams,
    Page, $location, $http, $sce, $state,
    $ionicHistory, $ionicScrollDelegate,
    loadingSpinner) {

    //Get page number and session, and admin
    $scope.pagenum = $stateParams.page;
    $scope.admin = localStorage.getItem("admin");
    var cookie = localStorage.getItem("session_token");

    var payload = {
        number: $scope.pagenum,
        token: cookie
    };

    //Get the page

    //Start loading
    loadingSpinner.startLoading();

    Page.get(payload, function(data) {

        //Stop loading
        loadingSpinner.stopLoading();

        //Then display the page
        $scope.pagecontents = data.content;
        $scope.pageNumber = data.number;
        $scope.pageNextNumber = data.nextnumber;
        $scope.trustedHtml = $sce.trustAsHtml($scope.pagecontents);

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

    $scope.goToNext = function(){

        //Go to the next page specified by the backend
        $state.go('app.single', {"page": $scope.pageNextNumber});
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

    $scope.editPage = function () {

        //Simply go to the edit page state
        //Go back to the page views
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        //Second param is state params
        $state.go('app.edit', {"page": $scope.pageNumber});

    }
});
