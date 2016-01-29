angular.module('starter.controllers', [])
.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup,
    $ionicPlatform, $timeout, $location, $state,
    $window, $ionicHistory, User, loadingSpinner) {

  //Platform detection
  $scope.platformIOS = ionic.Platform.isIOS() || ionic.Platform.isIPad();
  $scope.platformAndroid = ionic.Platform.isAndroid();

  $scope.settings = {};
  $scope.settings.easyReading = localStorage.getItem("easyReading") === "true";

  // Form data for the login modal
  $scope.loginData = {};

  //Form data for the go to page
  $scope.page = {};

  //Variable to catch our current errors
  $scope.errors = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    backdropClickToClose: false,
    id: 1,
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Create the go to page modal that we will use later
  $ionicModal.fromTemplateUrl('templates/gotopage.html', {
    id: 2,
    scope: $scope
  }).then(function(modal) {
    $scope.gotomodal = modal;
  });

  //Alert popup we shall use instead of alerts
  $scope.showAlert = function(aTitle, aText, callback) {
   var alertPopup = $ionicPopup.alert({
     title: aTitle,
     template: aText
   });
   alertPopup.then(function(res) {
     if(callback) callback();
   });
 };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Open the login modal
  $scope.goToPage = function() {
    $scope.gotomodal.show();
  };

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Triggered in the go to modal to close it
 $scope.closeGoTo = function() {
   $scope.gotomodal.hide();
 };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    //Start Loading
    loadingSpinner.startLoading();

    User.login($scope.loginData, function(data) {

        //Hide red error text, if it was shown
        $scope.authError = false;

        //Stop Loading
        loadingSpinner.stopLoading();

        //Store the token from the server for future use
        localStorage.setItem("session_token", data.token);

        //Store if they are an administrator
        if(data.admin) localStorage.setItem("admin", true);
        else localStorage.removeItem("admin");

        //Set validated to true
        sessionStorage.setItem("session_validated", true);

        //Store the user subscription notice
        localStorage.setItem("subscriptionDate", data.subscription);

        //Inform the user
        //Show an alert
        if(!data.admin && moment().add(6, 'd').isAfter(moment(data.subscription))) {

            //inform user there subscription is ending
            $scope.showAlert("Login Success, Subscription Ending Soon!", "Please notice that your subscription shall be ending: " +
             moment(data.subscription).format("dddd, MMMM Do YYYY") +
             ". Please visit the menu, and select (Manage Subscription) to extend your subscription. The Page will now reload...", function() {

                //They have been alerted
                sessionStorage.setItem("alerted", true);

                //Alert Call back
                $scope.closeLogin();

                //Reload the page
                $window.location.reload(true);
            });
        }
        else {

            //Show normal login alert
            $scope.showAlert("Login Success!", "The Page will now reload...", function() {

                //Alert Call back

                $scope.closeLogin();

                //Reload the page
                $window.location.reload(true);
            });
        }
    },
    //Errors
    function(response) {

        //Stop Loading
        loadingSpinner.stopLoading();

        if (response.status == 401 ||
        response.status == 412) {
           //Handle 401 error code

           //Show an error
           $scope.showAlert("Login Failed", "Email or password was incorrect!");

           //Show red error text
           $scope.authError = true;
       }
       else if(response.status == 402) {
           //Handle 402 Error
           //Payment Requried

           //Move them back to the index, no history
           $ionicHistory.nextViewOptions({
               disableBack: true
           });
           $state.go('app.register');

           //Show alert
           $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
       }
       else if (response.status == 500) {
         // Handle 500 error code

         //Show an error
         $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
       }
       else {
           //Handle General Error

           //An unexpected error has occured, log into console
           //Show an error
           $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
       }
    });
  };

  // Perform the find page
  $scope.goToPageNum = function() {
    //Go to the desired url
    $scope.temp = 'app/page/' + $scope.page.number;
    $location.path($scope.temp);

    //Now close the modal
    $scope.gotomodal.hide();
  };

  // go to the listing
  $scope.listing = function() {
    //Go to the desired url
    $location.path('app/listing');
  };

  sessionStorage.setItem('key', 'value');

  //Function to check if we are logged in
  $scope.loggedIn = function()
  {
    //attempt to grab our cookie
    var token = localStorage.getItem("session_token");
    var validated = sessionStorage.getItem("session_validated");
    if(!token) {
      return false;
    } else {
        if(validated){
            return true;
        } else {

            //Set validated to true until proven false;
            sessionStorage.setItem("session_validated", true);

            //Start Loading
            loadingSpinner.startLoading();

            User.get({token: token}, function(response){

                //Stop Loading
                loadingSpinner.stopLoading();

                //Store if they are an administrator
                if(response.admin) localStorage.setItem("admin", true);
                else localStorage.removeItem("admin");

                //Also Check if our subscription is ending
                var subDate = localStorage.getItem("subscriptionDate");
                var alerted = localStorage.getItem("alerted");
                var admin = response.admin;
                if(subDate &&
                    !admin &&
                    !alerted &&
                    moment().add(6, 'd').isAfter(moment(subDate))) {

                        //Alert the user their subscription is Ending
                        //inform user there subscription is ending
                        $scope.showAlert("Subscription Ending Soon!", "Please notice that your subscription shall be ending: " +
                         moment(subDate.subscription).format("dddd, MMMM Do YYYY") +
                         ". Please visit the menu, and select (Manage Subscription) to extend your subscription.");

                         //Set the alerted to true
                         //Save their subscription Date
                         localStorage.setItem("subscriptionDate", response.subscription);
                         localStorage.setItem("alerted", true);
                }
                return true;
            },
            //Errors from request
            function(response) {

                //Stop Loading
                loadingSpinner.stopLoading();

                //Proven False
                sessionStorage.setItem("session_validated", false);

                if (response.status == 401) {
                   //Handle 401 error code

                   //Pull up the login modal
                   $scope.login();

                   //Delete the token
                   localStorage.removeItem("session_token");

                   //Show an error
                   $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!");
               }
               else if(response.status == 402) {
                   //Handle 402 Error
                   //Payment Requried

                   //Delete the token
                   localStorage.removeItem("session_token");

                   //Move them back to the index, no history
                   $ionicHistory.nextViewOptions({
                       disableBack: true
                   });
                   $state.go('app.register');

                   //Show alert
                   $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
               }
               else if (response.status == 404) {
                 // Handle 404 error code

                 //Delete the token
                 localStorage.removeItem("session_token");

                 //Show an error
                 $scope.showAlert("No Connection!", "Internet Connection is required to use this app. Please connect to the internet with your device, and restart the app!");
               }
               else if (response.status == 500) {
                 // Handle 500 error code

                 //Show an error
                 $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
               }
               else {
                   //Handle General Error

                   //An unexpected error has occured, log into console
                   //Show an error
                   $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
               }
           });
        }
    }
  }

  // at the bottom of your controller
  //Check if we are logged in, if not, force the login popup
    $scope.init = function () {
        if(!$scope.loggedIn() && $location.path() != "/app/register")
        {
            $scope.modal.show();
        }
    };

    //Load function on page load
    $ionicPlatform.ready(function(){
        //timeout for a second then check if we are logged in
        $timeout( function()
        {
            $scope.init();
        }, 1000);
    });

})

.controller('SpinnerCtrl', function($scope, loadingSpinner) {

  //Initialize our loading spinner
  $scope.loading = loadingSpinner;

})

.controller('IndexCtrl', function($scope) {
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

.controller('ListingCtrl', function($scope) {
  $scope.indexes = [
    { title: 'Search results here', page: 1, id: 1},
    { title: 'Search result 2', page: 1, id: 2},
  ];
})

.controller('PageCtrl', function($scope, $stateParams,
    Page, $location, $http, $sce, $state,
    $ionicHistory, $ionicScrollDelegate,
    loadingSpinner) {

    //Get page number and session, and admin
    $scope.pagenum = $stateParams.page;
    $scope.admin = localStorage.getItem("admin");
    var cookie = localStorage.getItem("session_token");

    var payload = {
        number: $scope.pagenum,
        token: cookie
    };

    //Get the page

    //Start loading
    loadingSpinner.startLoading();

    Page.get(payload, function(data) {

        //Stop loading
        loadingSpinner.stopLoading();

        //Then display the page
        $scope.pagecontents = data.content;
        $scope.pageNumber = data.number;
        $scope.pageNextNumber = data.nextnumber;
        $scope.trustedHtml = $sce.trustAsHtml($scope.pagecontents);

        //Set our current error to none
        $scope.errors[0] = -1;
    },
    //Errors
    function(response) {

        //Stop loading
        loadingSpinner.stopLoading();

        if (response.status == 401) {
           //Handle 401 error code

           //Pull up the login modal
           $scope.login();

           //Show an error
           $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!")
       }
       else if(response.status == 402) {
           //Handle 402 Error
           //Payment Requried

           //Move them back to the index, no history
           $ionicHistory.nextViewOptions({
               disableBack: true
           });
           $state.go('app.register');

           //Show alert
           $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
       }
       else if (response.status == 500) {
         // Handle 500 error code

         //Show an error
         $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
       }
       else {
           //Handle General Error

           //An unexpected error has occured, log into console
           //Show an error
           $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
       }
   });

    $scope.goToNext = function(){

        //Go to the next page specified by the backend
        $state.go('app.single', {"page": $scope.pageNextNumber});
    }

    $scope.goToPrev = function(){
        $ionicHistory.goBack();
    }

    $scope.scrollBottom = function(){
        $ionicScrollDelegate.scrollBottom(true);
    }

    $scope.scrollTop = function(){
        $ionicScrollDelegate.scrollTop(true);
    }

    $scope.editPage = function () {

        //Simply go to the edit page state
        //Go back to the page views
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        //Second param is state params
        $state.go('app.edit', {"page": $scope.pageNumber});

    }
})

.controller('PageEditCtrl', function($scope, $stateParams,
    Page, $location, $state,
    $ionicHistory, $ionicScrollDelegate,
    loadingSpinner) {

    //Get the page number and cookie
    $scope.pagenum = $stateParams.page;

    //Initialize the page contents
    $scope.pagecontents = "";

    $scope.pageInit = function() {

        //If we are not an admin go back
        if(!localStorage.getItem("admin")) $ionicHistory.goBack();

        var cookie = localStorage.getItem("session_token");

        var payload = {
            number: $scope.pagenum,
            token: cookie
        };

        //Start loading
        loadingSpinner.startLoading();

        Page.get(payload, function(data) {

            //Stop loading
            loadingSpinner.stopLoading();

            //Then display the page
            $scope.pagecontents = data.content;
            $scope.pageNumber = data.number;
            $scope.pageNextNumber = data.nextnumber;

            //Set our current error to none
            $scope.errors[0] = -1;
        },
        //Errors
        function(response) {

            //Stop loading
            loadingSpinner.stopLoading();

            if (response.status == 401) {
               //Handle 401 error code

               //Pull up the login modal
               $scope.login();

               //Show an error
               $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!")
           }
           else if(response.status == 402) {
               //Handle 402 Error
               //Payment Requried

               //Move them back to the index, no history
               $ionicHistory.nextViewOptions({
                   disableBack: true
               });
               $state.go('app.register');

               //Show alert
               $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
           }
           else if (response.status == 500) {
             // Handle 500 error code

             //Show an error
             $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
           }
           else {
               //Handle General Error

               //An unexpected error has occured, log into console
               //Show an error
               $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
           }
       });
    }

    //Call the page init
    $scope.pageInit();

   //Function to save the edited page
   $scope.savePage = function() {

       //Start loading
       loadingSpinner.startLoading();

       //Grab our sessiontoken
       var cookie = localStorage.getItem("session_token");

       //Our payload
       var payload = {
           token: cookie,
           content: $scope.pagecontents,
           number: $scope.pageNumber,
           nextNumber: $scope.pageNextNumber,
       }

       Page.update(payload, function(response){

           //Handle succes here

           //Stop loading
           loadingSpinner.stopLoading();

           //Go back to the page views
           $ionicHistory.nextViewOptions({
               disableBack: true
           });
           //Second param is state params
           $state.go('app.single', {"page": $scope.pageNumber});

       }, function(response){

           //Stop loading
           loadingSpinner.stopLoading();

           //handle errors here
           if (response.status == 401) {
              //Handle 401 error code

              //Pull up the login modal
              $scope.login();

              //Show an error
              $scope.showAlert("Session Error", "Session Token not found, invalidated, or you are not an administrator, please log in!")
          }
          else if(response.status == 402) {
              //Handle 402 Error
              //Payment Requried

              //Move them back to the index, no history
              $ionicHistory.nextViewOptions({
                  disableBack: true
              });
              $state.go('app.register');

              //Show alert
              $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
          }
          else if (response.status == 500) {
            // Handle 500 error code

            //Show an error
            $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
          }
          else {
              //Handle General Error

              //An unexpected error has occured, log into console
              //Show an error
              $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
          }
       });
   }
})

.controller('SettingsCtrl', function($scope, $window) {


    $scope.saveSettings = function(){
        localStorage.setItem("easyReading", $scope.settings.easyReading);
    }

    $scope.logOut = function() {

        //Delete the cookie
        localStorage.removeItem("session_token");

        //Remove admin
        localStorage.removeItem("admin");

        //And reload the page
        //Show normal login alert
        $scope.showAlert("Logout Success!", "The Page will now reload...", function() {

            //Alert Call back

            $scope.closeLogin();

            //Reload the page
            $window.location.reload(true);
        });
    }

})

.controller('RegisterCtrl', function($scope, $ionicHistory, $http,
    $timeout, Page, User, $state,
    loadingSpinner, Price) {

    //SET OUR STRIPE KEY HERE
    Stripe.setPublishableKey('pk_test_u1eALgznI2RRoPFEN8e1q9s9');

    //Initialize our loading spinner for the button disabling
    $scope.loading = loadingSpinner;

    //Our data from the form
    $scope.registerData = {};

    //If our card is validated
    $scope.cardValidated = false;

    //Check if we are logged in,
    //If we are then fill the subscription information
    $scope.initPage = function() {

        if(localStorage.getItem("admin")) {

            //inform them of their admin powers
            $scope.showAlert("Admin Super Powers!", "Administrators and editors do not need to renew their subscription. I'll send you back to the home page", function() {

                //Send them back to the homepage
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                $state.go('app.index');
            });
        }

        if($scope.loggedIn())
        {

            //Start loading
            loadingSpinner.startLoading();

            //Validate the cookie, as well as, grab their email
            var payload = {
                token: localStorage.getItem("session_token")
            };

            User.get(payload, function(data) {

                //Stop loading
                loadingSpinner.stopLoading();

                //Auto fill their email for them
                $scope.registerData.email = data.email;

                //Also, get their subscription Date
                //Julian wants this weird week thingy
                if(moment().add(6, 'd').isAfter(moment(data.subscription))) {
                    $scope.subscription = moment(data.subscription).format("dddd")
                }
                else $scope.subscription = moment(data.subscription).format("MMM Do, YYYY");
                $scope.subscriptionDate = data.subscription;
            },
            //Errors
            function(response) {

                //Stop loading
                loadingSpinner.stopLoading();

                if (response.status == 401) {
                   //Handle 401 error code

                   //Pull up the login modal
                   $scope.login();

                   //Show an error
                   $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!")
               }
               else if(response.status == 402) {
                   //Handle 402 Error
                   //Payment Requried

                   //Move them back to the index, no history
                   $ionicHistory.nextViewOptions({
                       disableBack: true
                   });
                   $state.go('app.register');

                   //Show alert
                   $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
               }
               else if (response.status == 500) {
                 // Handle 500 error code

                 //Show an error
                 $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
               }
               else {
                   //Handle General Error

                   //An unexpected error has occured, log into console
                   //Show an error
                   $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
               }
           })
        }

        //Lastly, get the price
        $scope.price;
        $scope.priceText = "Getting Prices...";

        var payload = {

        };

        //Start loading
        loadingSpinner.startLoading();

        Price.get(payload, function(response) {

            //Stop loading
            loadingSpinner.stopLoading();

            //Check if we should get the price of a new user
            //or extension
            if($scope.loggedIn()) {

                //Set the price
                $scope.price = response.RENEW;

                //Set the text
                $scope.priceText = "Extend Subscription for 1 Year - $" + ($scope.price / 100);
            }
            else {

                //Set the price
                $scope.price = response.NEW;

                //Set the text
                $scope.priceText = "Create Subscription - $" + ($scope.price / 100);
            }
        },
        //errors
        function(response) {

            //Stop loading
            loadingSpinner.stopLoading();

            if (response.status == 401) {
               //Handle 401 error code

               //Pull up the login modal
               $scope.login();

               //Show an error
               $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!")
           }
           else if(response.status == 402) {
               //Handle 402 Error
               //Payment Requried

               //Move them back to the index, no history
               $ionicHistory.nextViewOptions({
                   disableBack: true
               });
               $state.go('app.register');

               //Show alert
               $scope.showAlert("Subscription Ended", "Please extend your subscription to continue using this app.");
           }
           else if (response.status == 500) {
             // Handle 500 error code

             //Show an error
             $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later!");
           }
           else {
               //Handle General Error

               //An unexpected error has occured, log into console
               //Show an error
               $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later!");
           }
        })

    }
    $scope.initPage();

    //Functions for the Form

    $scope.numbersOnly = function(event){
        if(((event.which < 48 || event.which > 57) && event.which != 46 && event.which != 8) || event.shiftKey){
            event.preventDefault();
        }
    }

    $scope.maxLength = function(event, length){
        if (event.target.value.length > length && event.which != 46 && event.which != 8) {
            event.preventDefault();
            event.target.value = event.target.value.slice(0,length);
        } else if (event.target.value.length == length && event.which != 46 && event.which != 8){
            event.preventDefault();
        }
    }

    function getCaretPosition(ctrl)
    {
        var caretPos = 0;
        // IE
        if (document.selection)
        {
            ctrl.focus ();
            var sel = document.selection.createRange();
            sel.moveStart ('character', -ctrl.value.length);
            caretPos = sel.text.length;
        }
        // Firefox
        else if (ctrl.selectionStart || ctrl.selectionStart == '0')
        {
            caretPos = ctrl.selectionStart;
        }

        return caretPos;
    }

    function setCaretPosition(elemId, caretPos) {
        var elem = document.getElementById(elemId);

        if(elem != null) {
            if(elem.createTextRange) {
                var range = elem.createTextRange();
                range.move('character', caretPos);
                range.select();
            }
            else {
                if(elem.selectionStart) {
                    elem.focus();
                    elem.setSelectionRange(caretPos, caretPos);
                }
                else
                    elem.focus();
            }
        }
    }

    $scope.registerData.ccNumber = "";
    $scope.formatCC = function(event){
        var caretPos = getCaretPosition(event.target) == event.target.value.length ? -3 : getCaretPosition(event.target);
        if(event.which == 46 || event.which == 8){
            var value = event.target.value.replace(/-/g, '');

            if(value.length > 4){
                value = [value.slice(0, 4), "-", value.slice(4)].join('');

                if(value.length > 9){
                    value = [value.slice(0, 9), "-", value.slice(9)].join('');

                    if(value.length > 14){
                        value = [value.slice(0, 14), "-", value.slice(14)].join('');
                    }
                }
            }
            event.target.value = value;

            //Also save the value to the scope
            $scope.registerData.ccNumber = value;

        } else if(event.which >= 48 && event.which <= 57){
            var value = event.target.value.replace(/-/g, '');

            if(value.length >= 4){
                value = [value.slice(0, 4), "-", value.slice(4)].join('');

                if(value.length >= 9){
                    value = [value.slice(0, 9), "-", value.slice(9)].join('');

                    if(value.length >= 14){
                        value = [value.slice(0, 14), "-", value.slice(14)].join('');
                    }
                }
            }
            if(caretPos == 4 || caretPos == 9 || caretPos == 14){
                caretPos++;
            }
            event.target.value = value;

            //Also save the value to the scope
            $scope.registerData.ccNumber = value;
        }
        if(caretPos >= 0){
            setCaretPosition(event.target.id, caretPos);
        }
        $scope.validateCardNumber(event);
    }

    //Star the credit card field
    $scope.ccStar = function () {

        //First get the input field
        var ccField = document.getElementById("ccNumber");

        //Get the value
        var ccNum = ccField.value;

        //Loop through and add some stars
        for(var i = ccNum.length - 6; i >= 0; i--)
        {

            //Replace the characters that are not dashes
            if(ccNum.charAt(i) != '-') ccNum = ccNum.substring(0, i) + "*" + ccNum.substring(i + 1);
        }

        //Set the field value!
        ccField.value = ccNum
    }

    //unstar the credit card field
    $scope.ccUnStar = function () {

        //Simply replace the field value with the actual value
        document.getElementById("ccNumber").value = $scope.registerData.ccNumber;
    }

    /**
     * Validates form CC. Checks Stripe for validity, determines card type and sets card icon.
     */
    $scope.validateCardNumber = function(event) {
        //Concatante the credit card number together
        var cardNumber = event.target.value.replace(/-/g, '');

        //Check if the credit card number is US valid
        if(Stripe.card.validateCardNumber(cardNumber) && (cardNumber.length == 13 || cardNumber.length == 15 || cardNumber.length == 16)) {
            $scope.validCC = true;
        }
        else {
            $scope.validCC = false;
        }

        //Now see if the card is validated
        $scope.validateCard();
    }

    /**
     * Validates form Date. Checks Stripe for validity.
     */
    $scope.validateDate = function() {

        $scope.dateValidated = Stripe.card.validateExpiry($scope.registerData.expireM, $scope.registerData.expireY);

        //Now see if the card is validated
        $scope.validateCard();
    }

    /**
     * Validates form CVC. Checks Stripe for validity.
     */
    $scope.validateCVC = function() {

        //get the input
        var input1 = document.getElementById("cardCvv");

        $scope.cvcValidated = Stripe.card.validateCVC(input1.value);

        //Now see if the card is validated
        $scope.validateCard();
    }

    /**
     * Validates form zipcode. Checks for length.
     */
    $scope.validateZip = function() {
        //get the input
        var input1 = document.getElementById("zipCode");

        //Simply check if there are 5 digits
        if (input1.value.length > 4) {
            $scope.zipValidated = true;
        } else {
            $scope.zipValidated = false;
        }

        //Now see if the card is validated
        $scope.validateCard();
    }

    /**
     * Validates email field
     */
    $scope.validateEmail = function() {
        //Fetch email from giftcard form
        var email = $scope.registerData.email;

        //Regex for all valid emails. To add a TLD, edit the final OR statement.
        var emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|co|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/;
        //Test the form email against the regex
        if (emailRegex.test(email)) {
            return true;
        } else {
            return false;
        }
    }


    /**
     * Checks if all CC fields have been validated independantly
     */
    $scope.validateCard = function() {
        if ($scope.validCC && $scope.dateValidated && $scope.cvcValidated && $scope.zipValidated) {
            $scope.cardValidated = true;
        } else {
            $scope.cardValidated = false;
            $scope.cardType = "";
        }
    }

    //Function to go back to the previous page
    $scope.goToPrev = function(){
        $ionicHistory.goBack();
    }

    //Create the user
    $scope.registerUser = function() {

        //Hide the ng class red error text if show
        $scope.passwordError = false;
        $scope.cardError = false;
        $scope.emailError = false;

        //Check if the passwords matched
        if($scope.registerData.password != $scope.registerData.confirmPassword) {

            //Display alert, and ng class
            $scope.passwordError = true;

            $scope.showAlert("Password Error", "Please check your password and confirmed password.");
        }
        else {

            //Start loading
            loadingSpinner.startLoading();

            //Create finalized card number
            var cardNumber = $scope.registerData.ccNumber;

            //Send card info to stripe for tokenization
            Stripe.card.createToken({
                "number": $scope.registerData.ccNumber,
                "cvc": $scope.registerData.cvv,
                "exp_month": $scope.registerData.expireM,
                "exp_year": $scope.registerData.expireY
            }, function(status, response) {
                if (response.error) {

                    //Display alert, and show card errors
                    $scope.cardError = true;

                    //Stop loading
                    loadingSpinner.stopLoading();

                    $scope.showAlert("Card Error", "Please check your card information.");

                } else {

                    //Dont stop loading here, going to make another backend request

                    //Get the token to be submitted later, after the second page
                    // response contains id and card, which contains additional card details
                    var stripeToken = response.id;

                    //Create our payload
                    var payload = {
                        cardToken: stripeToken,
                        email: $scope.registerData.email,
                        password: $scope.registerData.password
                    }

                    //Submitting Now!
                    User.register(payload, function(data) {

                        //Stop loading
                        loadingSpinner.stopLoading();

                        //Success!

                        //save their session
                        localStorage.setItem("session_token", data.token);

                        //Save them as non administrator
                        localStorage.removeItem("admin");

                        //Save their subscription Date
                        localStorage.setItem("subscriptionDate", data.subscription);
                        localStorage.setItem("alerted", false);

                        //Move them back to the index, no history
                        $ionicHistory.nextViewOptions({
                            disableBack: true
                        });
                        $state.go('app.index');

                        //Alert them of success!
                        $scope.showAlert("Success!", "You have successfully registered! Your account is valid for a year (valid unitl: " + moment(data.subscription).format("MMM Do, YYYY") + "), and can be extended. Enjoy!");

                    },
                    //Errors
                    function(response) {

                        //Stop loading
                        loadingSpinner.stopLoading();

                        if (response.status == 401) {
                           //Handle 401 error code

                           //Pull up the login modal
                           $scope.login();

                           //Show an error
                           $scope.showAlert("Session Error", "Session Token not found or invalidated, please log in!")
                       }
                       else if (response.status == 416) {
                         // Handle 416 error code

                         //Ng class red email text
                         $scope.emailError = true;

                         //Show an error
                         $scope.showAlert("Email Taken", "Sorry, that email has been taken. Please enter another email!");
                       }
                       else if (response.status == 500) {
                         // Handle 500 error code

                         //Show an error
                         $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later! Your card has not been charged!");
                       }
                       else {
                           //Handle General Error

                           //An unexpected error has occured, log into console
                           //Show an error
                           $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later! Your card has not been charged!");
                       }
                   });
                }

                //Force the change to refresh, we need to do this because I
                //guess response scope is a different scope and has to be
                //forced or interacted with
                $scope.$apply();
            });
        }
    }

    //Update the user
    $scope.updateUser = function() {

        //Hide the ng class red error text if show
        $scope.passwordError = false;
        $scope.cardError = false;
        $scope.emailError = false;

        //Start Loading
        loadingSpinner.startLoading();

        //Create finalized card number
        var cardNumber = $scope.registerData.ccNumber;

        //Send card info to stripe for tokenization
        Stripe.card.createToken({
            "number": $scope.registerData.ccNumber,
            "cvc": $scope.registerData.cvv,
            "exp_month": $scope.registerData.expireM,
            "exp_year": $scope.registerData.expireY
        }, function(status, response) {
            if (response.error) {

                //Stop loading
                loadingSpinner.stopLoading();

                //Display alert
                $scope.cardError = true;

                $scope.showAlert("Card Error", "Please check your card information.");

            } else {

                //Get the token to be submitted later, after the second page
                // response contains id and card, which contains additional card details
                var stripeToken = response.id;

                //Create our payload
                var payload = {
                    cardToken: stripeToken,
                    email: $scope.registerData.email,
                    password: $scope.registerData.password
                }

                //Submitting Now!
                User.renew(payload, function(data) {

                    //Stop loading
                    loadingSpinner.stopLoading();

                    //Success!
                    //save their session
                    localStorage.setItem("session_token", data.token);

                    //Save them as non administrator
                    localStorage.removeItem("admin");

                    //Save their subscription Date
                    localStorage.setItem("subscriptionDate", data.subscription);
                    localStorage.setItem("alerted", false);

                    //Move them back to the index, no history
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    $state.go('app.index');

                    //Alert them of success!
                    $scope.showAlert("Success!", "You have successfully registered! Your account is valid for a year (valid unitl: " + moment(data.subscription).format("MMM Do, YYYY") + "), and can be extended. Enjoy!");

                },
                //Errors
                function(response) {

                    //Stop loading
                    loadingSpinner.stopLoading();

                    if (response.status == 401) {
                       //Handle 401 error code

                       //show red ng class text
                       $scope.emailError = true;
                       $scope.passwordError = true;

                       //Show an error
                       $scope.showAlert("Authentication Error", "Please check your email and password.")
                   }
                   else if (response.status == 500) {
                     // Handle 500 error code

                     //Show an error
                     $scope.showAlert("Server Error", "Either your connection is bad, or the server is having problems. Please try re-opening the app, or try again later! Your card has not been charged!");
                   }
                   else {
                       //Handle General Error

                       //An unexpected error has occured, log into console
                       //Show an error
                       $scope.showAlert("Error: " + response.status, "Unexpected Error. Please try re-opening the app, or try again later! Your card has not been charged!");
                   }
               });
            }

            //Force the change to refresh, we need to do this because I
            //guess response scope is a different scope and has to be
            //forced or interacted with
            $scope.$apply();
        });
    }

});
