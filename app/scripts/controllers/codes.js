angular.module('starter')
.controller('CodesCtrl', function($scope, User, Notifications) {

  //Initializing token variable
  $scope.token = localStorage.getItem("session_token");

  //Obtain Generarted Promo Codes from Server
  $scope.getPromoCodes = function(){
    if($scope.tokenDate && $scope.tokenNum){
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
        Notifications.show("Error", "You need to specify a valid number and a valid date.");
    }
  }

  //Selects all generated codes
  $scope.selectAll = function(){
    setTimeout(function(){
      document.getElementById("promo-area").select();
    }, 10);
  }
});
