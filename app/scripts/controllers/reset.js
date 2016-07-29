angular.module('starter')
.controller('ResetCtrl', function($scope, $stateParams, $location, User, Notifications) {

  //Initializing token variable
  $scope.token = $location.search().token;
  if($scope.token){
      localStorage.setItem("session_token", $scope.token);
  } else {
      $location.path("index");
  }

  //Obtain Generarted Promo Codes from Server
  $scope.getPromoCodes = function(){
    if($scope.tokenNum && $scope.tokenDate && moment($scope.tokenDate).isAfter(moment())){
        var payload = {
          "token": $scope.token,
          "count": $scope.tokenNum,
          "date": $scope.tokenDate
        }
        User.obtainPromoSet(payload,
          function(response){
            $scope.promoArray = response;
            var codes = "";
            for(i =0; i<response.length; i++){
              codes += response[i] + "\n";
            }
            $scope.promoCodes = codes;
          }, function(err){
            switch(err.status){
              case 401:
                Notifications.show("Error", "You are not an administrator.");
                break;
              default:
                Notifications.show("Error Connecting to Server", "You encountered a problem with your connection.");
            }
          });
    } else {
        Notifications.show("Error", "You need to specify a valid number and a valid date. Date must be after today.");
    }
  }

  //Selects all generated codes
  $scope.selectAll = function(){
    setTimeout(function(){
      document.getElementById("promo-area").select();
    }, 10);
  }
});
