angular.module('starter')
.controller('PageEditCtrl', function($scope, $stateParams,
    Page, $location, $state,
    $ionicHistory, $ionicScrollDelegate,
    loadingSpinner, Notifications) {

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

            //Handle the error with notifications
            Notifications.error(response);
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

           //Create our custom error handlers
           var handlers = [
               {
                   status: 401,
                   title: "Session Error",
                   text: "Session Token not found, invalidated, or you are not an administrator, please log in!",
                   callback: function() {

                       //Pull up the login modal
                       $scope.login();
                   }
               }
           ]

           //Handle the error with notifications
           Notifications.error(response, handlers);
       });
   }
});
