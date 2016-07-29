angular.module('starter')
.controller('ResetCtrl', function($scope, $ionicHistory, $state, $location, loadingSpinner, User, Notifications) {

  //Initializing token variable
  $scope.token = $location.search().token;
  if($scope.token){
      localStorage.setItem("session_token", $scope.token);
  } else {
      //Move them back to the index, no history
      $ionicHistory.nextViewOptions({
          disableBack: true
      });
      $state.go('app.index');
  }

  $scope.resetData = {}

  //Initialize our loading spinner for the button disabling
  $scope.loading = loadingSpinner;

  $scope.updateUser = function(){
      //Start loading
      loadingSpinner.startLoading();

      var payload = {
          password: $scope.resetData.password,
          token: $scope.token
      }
      User.update(payload, function(res){
          //Stop loading
          loadingSpinner.stopLoading();

          Notifications.show("Success", "Your new password has been saved!", function(){
              //Move them back to the index, no history
              $ionicHistory.nextViewOptions({
                  disableBack: true
              });
              $state.go('app.index');
          });
      }, function(err){
          //Our custom Error Handler
          var handlers = [
              {
                  status: 401,
                  title: "Something Went Wrong",
                  text: "Please try requesting a new password reset email. Your current reset link is no longer valid."
              }
          ]

          //Send to the notification handler
          Notifications.error(err, handlers);
      });
  }
});
