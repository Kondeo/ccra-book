angular.module('starter')
.controller('CodesCtrl', function($scope, User) {

  //Initializing token variable
  $scope.token = localStorage.getItem("session_token");
  //$scope.tokenNum = 0;

  $scope.getPromoCodes = function(){
    var payload = {
      "token": $scope.token,
      "count": $scope.tokenNum
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

      });
  }

  $scope.selectAll = function(){
    console.log("bo");
    setTimeout(function(){
      document.getElementById("promo-area").select();

    }, 10);
  }
});
