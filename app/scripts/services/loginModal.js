angular.module('starter')
.service('LoginModal', function($ionicPopup, $ionicModal) {

        //Our login modal
        var loginModal;
        $ionicModal.fromTemplateUrl('templates/modals/login.html', {
          backdropClickToClose: false,
          id: 1
        }).then(function(modal) {
          loginModal = modal;
        });

        //Return our functions we would like to use
        return {

            show: function() {

                //Open the login modal
                loginModal.show();
            },

            hide: function() {

                //Close the login modal
                loginModal.hide();
            }
        }

});
