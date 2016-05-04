angular.module('starter')
.controller('PageCtrl', function($scope, $stateParams,
    Page, $location, $http, $sce, $state,
    $ionicHistory, $ionicScrollDelegate,
    loadingSpinner, Notifications,
    LoginModal) {

    //Get page number and session, and admin
    $scope.pagenum = $stateParams.page;
    $scope.admin = localStorage.getItem("admin");
    var cookie = localStorage.getItem("session_token");

    $scope.searchResults = sessionStorage.getItem("search_indexes") === null ? false : JSON.parse(sessionStorage.getItem("search_indexes"));
    if($scope.searchResults && $scope.searchResults.indexOf(parseInt($scope.pagenum)) > -1){
      $scope.searchResult = true;
    }

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

        //Var handlers, handle 412 as a login because it means the session_token
        //there is not session_token
        if(!localStorage.getItem("session_token") ||
        localStorage.getItem("session_token") == "") {

            var handlers = [
                {
                    status: 412,
                    title: "Session Error!",
                    text: "Session not found or invalidated, please log in.",
                    callback: function() {

                        //Pull up the login modal
                        LoginModal.show();
                    }
                }
            ];

            //Handle the error with notifications
            Notifications.error(response, handlers);
        }
        else {

            //Handle the error with notifications
            Notifications.error(response);
        }
   });

   $scope.goTo = function(direction, searchResult){
     if(searchResult){
       if(direction == "next"){
         $state.go('app.single', {"page": $scope.searchResults[$scope.searchResults.indexOf(parseInt($scope.pagenum)) + 1]});
       } else {
         console.log("back")
         $state.go('app.single', {"page": $scope.searchResults[$scope.searchResults.indexOf(parseInt($scope.pagenum)) - 1]});
       }
     }
   }

   $scope.toInt = function(myInt){
     return parseInt(myInt);
   }

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
