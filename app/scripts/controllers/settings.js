angular.module('starter')
.controller('SettingsCtrl', function($scope, $window,
    Notifications, LoginModal) {

    $scope.saveSettings = function(){
        localStorage.setItem("setting_easyReading", $scope.settings.easyReading);
        localStorage.setItem("setting_tutorial", $scope.settings.tutorial);
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
            LoginModal.hide();

            //Reload the page
            $window.location.reload(true);
        });
    }

});
