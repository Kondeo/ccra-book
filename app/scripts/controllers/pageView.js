angular.module('starter')
.controller('PageCtrl', function($scope, $stateParams,
    Page, $location, $http, $sce, $state,
    $ionicHistory, $ionicScrollDelegate,
    loadingSpinner, Notifications) {

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

        //Handle the error with notifications
        Notifications.error(response);
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
