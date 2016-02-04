angular.module('starter')
.controller('IndexCtrl', function($scope,
    $location, Page, loadingSpinner, Notifications) {

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

        loadingSpinner.startLoading();

        Page.query(payload, function(response) {

            //Stop loading
            loadingSpinner.stopLoading();

            //Non-Commented Julian Code

            var results = response.hits.hits;
            for(var i=0;i<results.length;i++){
                results[i].highlight.content[0] = remove_tags(results[i].highlight.content[0]);
                var startTag = "<mark>";
                var endTag = "</mark>";
                var startIndexes = getIndicesOf(startTag, results[i].highlight.content[0], false);
                var endIndexes = getIndicesOf(endTag, results[i].highlight.content[0], false);

                if(startIndexes.length != endIndexes.length){
                    console.log("INDEX PROBLEM. DOCUMENT ERROR.");
                    break;
                }

                //This holds the paragraph
                var bigFind = "";
                for(var j=0;j<startIndexes.length;j++){
                    var start = startIndexes[j] - 75;
                    var relatives = findRelatives(j, 75, endIndexes, startIndexes, endIndexes[j], 0);
                    j = j + relatives.skip;
                    var end = relatives.end;
                    var chunk = results[i].highlight.content[0].substring(start, end);
                    bigFind += "..." + chunk + "...";
                    if(j+1 != startIndexes.length) bigFind += "<br />";
                }

                results[i].highlight.content[0] = bigFind;
            }
            $scope.searchResults = results;
            results = null;
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

    function remove_tags(html) {
     var html = html.replace(/<mark>/g,"||mark||");
     var html = html.replace(/<\/mark>/g,"||/mark||");
     var tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     html = tmp.textContent||tmp.innerText;
     html = html.replace(/\|\|\/mark\|\|/g,"</mark>");
     return html.replace(/\|\|mark\|\|/g,"<mark>");
   }

   function getIndicesOf(searchStr, str, caseSensitive) {
      var startIndex = 0, searchStrLen = searchStr.length;
      var index, indices = [];
      if (!caseSensitive) {
          str = str.toLowerCase();
          searchStr = searchStr.toLowerCase();
      }
      while ((index = str.indexOf(searchStr, startIndex)) > -1) {
          indices.push(index);
          startIndex = index + searchStrLen;
      }
      return indices;
  }
  function findRelatives(j, width, endIndexes, startIndexes, endIndex, skip){
      endIndex += width;
      if(endIndexes[j] + width > startIndexes[j+1] && j+1 < startIndexes.length){
        return findRelatives(j+1, width, endIndexes, startIndexes, endIndexes[j+1], skip + 1);
      } else {
        return { "end": endIndex, "skip": skip };
      }
  }
})
