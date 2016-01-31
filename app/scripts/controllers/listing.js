angular.module('starter')
.controller('ListingCtrl', function($scope) {
  $scope.indexes = [
    { title: 'Search results here', page: 1, id: 1},
    { title: 'Search result 2', page: 1, id: 2},
  ];
});
