angular.module('starter')
.controller('SettingsCtrl', function($scope, $window) {


    $scope.saveSettings = function(){
        localStorage.setItem("easyReading", $scope.settings.easyReading);
    }

    $scope.logOut = function() {

        //Delete the cookie
        localStorage.removeItem("session_token");

        //Remove admin
        localStorage.removeItem("admin");

        //And reload the page
        //Show normal login alert
        Notifications.show("Logout Success!", "The Page will now reload...", function() {

            //Alert Call back

            $scope.closeLogin();

            //Reload the page
            $window.location.reload(true);
        });
    }

});
