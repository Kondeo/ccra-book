angular.module('starter')
.controller('SpinnerCtrl', function($scope, loadingSpinner) {

  //Initialize our loading spinner
  $scope.loading = loadingSpinner;

});
