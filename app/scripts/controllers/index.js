angular.module('starter')
.controller('IndexCtrl', function($scope,
    $location, $timeout, Page, loadingSpinner, Notifications, $ionicScrollDelegate) {

    $scope.searchResults = [];

    var cookie = localStorage.getItem("session_token");

    $scope.setTutorial = function(val){
      $scope.settings.tutorial = val;
      localStorage.setItem("setting_tutorial", val);
    }

    $scope.goTo = function(page){
        $scope.temp = 'app/page/' + page;
        $location.path($scope.temp);
    }

    //Called every time user scrolls
    //Evaluates whether searchbar should pop out
    $scope.searchHover = function(){
      $timeout(function(){
        //Get current position of scrolling window from Ionic
        var scrollPos = $ionicScrollDelegate.getScrollPosition().top;
        if(scrollPos > 44){
          $scope.navHovering = true;
        } else {
          $scope.navHovering = false;
        }
      });
    }

    //Called upon searchbar submission
    $scope.search = function(query, $event){
        //Blur focus on search field. This is used for enter key events.
        //This parameter is optional, thus the 'if'
        if($event) $event.target.blur();

        $ionicScrollDelegate.scrollTop();

        $scope.searched = true;

        //Quit the search if too short, so as to not execute large and useless queries
        if(query.length <= 3) return;

        //query = query.replace(/\(|\)|\[|\]|\{|\}/g,'\\');
        //Fuzzy everything if not a literal search, or if fuzzy not manually specified
        if(query.indexOf("\"") == -1 && query.indexOf("~") == -1){
          query = query.replace(/\s+/g,' ').trim();
          query = query.replace(/ /g, "~ ");
          query = query + "~";
        }

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
                var titleStart = results[i].highlight.content[0].indexOf("<strong>");
                var titleEnd = results[i].highlight.content[0].indexOf("</strong>")
                if(titleStart > -1 && titleEnd > -1) bigFind += results[i].highlight.content[0].substring(titleStart, titleEnd + 9) + "<br />";
                for(var j=0;j<startIndexes.length;j++){
                    //if(skippedWords.indexOf(results[i].highlight.content[0].substring(startIndexes[j] + 6, endIndexes[j])) >= 0) {console.log("asdf"); continue};
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
                },
                {
                    status: 500,
                    title: "Search Engine Error!",
                    text: "Please check your query. You may have used some special (reserved) characters in your search improperly. Please read the tutorial. Some special characters are reserved for advanced search functionality.<br /><br />If you didn't use any special characters in your search, the server may be having problems at the moment.",
                }
            ];

            //Simply pass to our notifications
            Notifications.error(response, handlers);
        });
    }

    function remove_tags(html) {
      //Replace <mark> tags
      var html = html.replace(/<mark>/g,"||mark||");
      html = html.replace(/<\/mark>/g,"||/mark||");
      //Replace <strong> tags (only first occurance)
      html = html.replace(/<strong>/,"||strong||");
      html = html.replace(/<\/strong>/,"||/strong||");
      //Strip the tags
      var tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      html = tmp.textContent||tmp.innerText;
      //Replace back <mark> tags
      html = html.replace(/\|\|\/mark\|\|/g,"</mark>");
      html = html.replace(/\|\|mark\|\|/g,"<mark>");
      //Replace back <strong> tags
      html = html.replace(/\|\|\/strong\|\|/g,"</strong>");
      html = html.replace(/\|\|strong\|\|/g,"<strong>");
      //Words we do not want to highlight
      var skippedWords = [
        "if",
        "of",
        "and",
        "or",
        "as",
        "am",
        "be",
        "on",
        "a"
      ]
      //Go through the skipped words, and remove highlighting on all
      for(var i=0;i<skippedWords.length;i++){
        var re = new RegExp("<mark>" + skippedWords[i] + "</mark>","g");
        html = html.replace(re, skippedWords[i]);
      }
      return html;
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
