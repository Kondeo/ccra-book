angular.module('starter')
.controller('IndexCtrl', function($scope, $location, Page) {
  $scope.indexes = [
    { title: 'Index list will be here', page: 1, id: 1, indented: 0},
    { title: 'Index item 2', page: 1, id: 1, indented: 0}
    ];

    $scope.searchResults = [];

    var cookie = localStorage.getItem("session_token");

    $scope.goTo = function(page){
        $scope.temp = 'app/page/' + page;
        $location.path($scope.temp);
    }

    $scope.search = function(query){
        Page.query({
            query: query,
            token: cookie
        }, function(response){
            for(var i=0;i<response.hits.hits.length;i++){
                response.hits.hits[i]._source.content = strip(response.hits.hits[i]._source.content).substring(0, 200) + "...";
            }
            $scope.searchResults = response.hits.hits;
        });
    }

    function strip(html){
       var tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }
})
