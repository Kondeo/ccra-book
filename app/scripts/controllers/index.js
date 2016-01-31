angular.module('starter')
.controller('IndexCtrl', function($scope,
    $location, Page,
    Notifications) {
        
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

        //Create our payload
        var payload = {
            query: query,
            token: cookie
        };

        Page.query(payload, function(response) {

            //Non-Commented Julian Code
            for(var i=0;i<response.hits.hits.length;i++){
                response.hits.hits[i]._source.content = strip(response.hits.hits[i]._source.content).substring(0, 200) + "...";
            }
            $scope.searchResults = response.hits.hits;
        },
        //Errors
        function(response) {

            //Var handlers, handle 412 as a login because it means the session_token
            //Doesnt exist yet
            var handlers = [
                {
                    status: 412,
                    title: "Session Error!",
                    text: "Session not found or invalidated, please log in.",
                }
            ];

            //Simply pass to our notifications
            Notifications.error(response, handlers);
        });
    }

    function strip(html){
       var tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }
})
