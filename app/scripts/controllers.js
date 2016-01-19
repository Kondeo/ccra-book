angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup,
    $ionicPlatform, $timeout, $location,
    $window, $ionicHistory, User) {

  //Moment.js

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

    User.login($scope.loginData, function(data) {

        //Hide red error text, if it was shown
        $scope.authError = false;

        //Store the token from the server for future use
        localStorage.setItem("session_token", data.token);

        //Inform the user
        //Show an error
        $scope.showAlert("Login Success!", "The Page will now reload...")


        $scope.closeLogin();
        //Reload the page
        $window.location.reload(true);
    },
    //Errors
    function(response) {
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

            User.get({token: token}, function(){
                sessionStorage.setItem("session_validated", true);
                return true;
            },
            //Errors from request
            function(response) {

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

.controller('IndexCtrl', function($scope) {
  $scope.indexes = [
    { title: 'Index list will be here', page: 1, id: 1, indented: 0},
    { title: 'Index item 2', page: 1, id: 1, indented: 0}
  ];
})

.controller('ListingCtrl', function($scope) {
  $scope.indexes = [
    { title: 'Search results here', page: 1, id: 1},
    { title: 'Search result 2', page: 1, id: 2},
  ];
})

.controller('PageCtrl', function($scope, $stateParams,
    Page, $location, $http, $sce, $state,
    $ionicHistory, $ionicScrollDelegate) {
    $scope.pagenum = $stateParams.page;
    var cookie = localStorage.getItem("session_token");

    var payload = {
        number: $scope.pagenum,
        token: cookie
    };

    //Get the page
    Page.get(payload, function(data) {

        //Then display the page
        $scope.pagecontents = data.content;
        $scope.trustedHtml = $sce.trustAsHtml($scope.pagecontents);

        //Set our current error to none
        $scope.errors[0] = -1;
    },
    //Errors
    function(response) {
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
        var temp = parseInt($stateParams.page) + 1;
        console.log(temp)
        temp = 'app/page/' + temp;

        $location.path(temp);
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
})

.controller('SettingsCtrl', function($scope) {


    $scope.saveSettings = function(){
        localStorage.setItem("easyReading", $scope.settings.easyReading);
    }

})

.controller('RegisterCtrl', function($scope, $ionicHistory, $http,
    $timeout, Page, User, $state) {

    //SET OUR STRIPE KEY HERE
    Stripe.setPublishableKey('pk_test_u1eALgznI2RRoPFEN8e1q9s9');

    //Our data from the form
    $scope.registerData = {};

    //If our card is validated
    $scope.cardValidated = false;

    //Check if we are logged in,
    //If we are then fill the subscription information
    $scope.initPage = function() {

        if($scope.loggedIn())
        {
            //Validate the cookie, as well as, grab their email
            var payload = {
                token: localStorage.getItem("session_token")
            };

            User.get(payload, function(data) {

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
                    User.register(payload, function(data) {

                        //Success!
                        //save their session
                        localStorage.setItem("session_token", data.token);

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

                    //Success!
                    //save their session
                    localStorage.setItem("session_token", data.token);

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
