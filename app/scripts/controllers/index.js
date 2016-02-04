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

            var results = response.hits.hits;
            for(var i=0;i<results.length;i++){
                results[i].highlight.content[0] = remove_tags(results[i].highlight.content[0]);
                var startTag = "<mark>";
                var endTag = "</mark>";
                var startIndexes = getIndicesOf(start, results[i].highlight.content[0], false);
                var endIndexes = getIndicesOf(end, results[i].highlight.content[0], false);
                if(startIndexes.length != endIndexes.length){
                    console.log("INDEX PROBLEM. DOCUMENT ERROR.");
                    break;
                }
                for(var j=0;j<startIndexes.length;j++){
                    var start = startIndexes[j] + startTag.length;
                    var end = endIndexes[j];
                    if(endIndexes[j] + 75 > startIndexes[j+1]){

                    }
                    var chunk = results[i].highlight.content[0].substring(start - 75, end + 75);
                }

                function findRelatives(j, width, endIndexes, startIndexes, endIndex){
                    endIndex += 
                    if(endIndexes[j] + 75 > startIndexes[j+1] && j+1 < startIndexes.length){
                      findRelatives(j+1, width, endIndexes, startIndexes);
                    } else {
                      return chunks;
                    }
                }

                results[i].highlight.content[0] = "..." + chunk + "...";
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

    function strip(html){
       var tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }

    function stripHTML(my_string){
      charArr   = my_string.split('');
      resultArr = [];
      htmlZone  = 0;
      quoteZone = 0;
      for( x=0; x < charArr.length; x++ ){
       switch( charArr[x] + htmlZone + quoteZone ){
         case "<00" : htmlZone  = 1;break;
         case ">10" : htmlZone  = 0;resultArr.push(' ');break;
         case '"10' : quoteZone = 1;break;
         case "'10" : quoteZone = 2;break;
         case '"11' :
         case "'12" : quoteZone = 0;break;
         default    : if(!htmlZone){ resultArr.push(charArr[x]) }
       }
      }
      return resultArr.join('')
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
})
