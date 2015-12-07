angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup, $ionicPlatform, $timeout, $location, $window, Book) {
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
  $scope.showAlert = function(aTitle, aText) {
   var alertPopup = $ionicPopup.alert({
     title: aTitle,
     template: aText
   });
   alertPopup.then(function(res) {
     //Do nothing here
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

    $scope.loginFinish = Book.login($scope.loginData, function() {
        //Determine response from server
        if (!$scope.loginFinish.result) {
            $scope.showAlert("Alert!", "Sorry, that isn't the correct username and password.");
        } else {
            //Store the token from the server for future use
            localStorage.setItem("session_token", $scope.loginFinish.result.session_token);
            $scope.closeLogin();
            //Reload the page
            $window.location.reload(true);
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

  //Function to check if we are logged in
  $scope.loggedIn = function()
  {
    //attempt to grab our cookie
    var cookie = localStorage.getItem("session_token");
    if(cookie != "")
    {
      return true;
    }
    else
    {
      return false;
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

.controller('RegisterCtrl', function($scope, $location, Book) {
    // Form data for the register controller
    $scope.registerData = {};

    // Perform the login action when the user submits the login form
    $scope.doRegister = function() {

        //Check for empty fields
        if($scope.registerData.email == null ||
        $scope.registerData.username == null ||
        $scope.registerData.password == null ||
        $scope.registerData.confirmPassword == null)
        {
            $scope.showAlert("Alert!", "Please complete all fields!");
        }
        //Check for non matching passwords
        else if($scope.registerData.password != $scope.registerData.confirmPassword)
        {
            $scope.showAlert("Alert!", "The passwords do not match!");
        }
        //Check email
        else if($scope.registerData.email.indexOf("@") == -1)
        {
            $scope.showAlert("Alert!", "Please enter a valid E-mail Adress!");
        }
        //Send to backend
        else
        {

            $scope.registerFinish = Book.register($scope.registerData, function() {
                //Determine response from server
                if ($scope.registerFinish.error) {
                    if($scope.registerFinish.error.errorid == '22')
                    {
                        $scope.showAlert("Alert!", "Sorry, that username already exists.");
                    }
                    else if($scope.registerFinish.error.errorid == '23')
                    {
                        $scope.showAlert("Alert!", "Sorry, you have not purchased the software.");
                    }
                }
                else
                {
                    //Store the token from the server for future use
                    localStorage.setItem("session_token", $scope.registerFinish.result.session_token);
                    $location.path("#/");
                }
            });
        }
    }

})

.controller('PageCtrl', function($scope, $stateParams, Book, $location, $http, $sce, $state, $ionicHistory, $ionicScrollDelegate) {
    $scope.pagenum = $stateParams.page;
    var cookie = localStorage.getItem("session_token");
    $http.get('http://localhost:3000/pages/' + $stateParams.page).
      success(function(data, status, headers, config) {
        // this callback will be called asynchronously
        // when the response is available
        //Check for any errors
        if(data.error)
        {
            if(data.error.errorid == '12')
            {
                $scope.showAlert("Alert!", "Session token is no longer valid, please login!");

                //Set our current error
                $scope.errors[0] = 12;

                $scope.login();
            }
        }
        else
        {
            //Then display the page
            $scope.pagecontents = data.pageContent;
            $scope.trustedHtml = $sce.trustAsHtml($scope.pagecontents);

            //Set our current error to none
            $scope.errors[0] = -1;
        }
      }).
      error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
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

.controller('RegisterCtrl', function($scope, $ionicHistory, $http, $timeout) {

    //SET OUR STRIPE KEY HERE

    //Our data from the form
    $scope.registerData = {};

    //Get our session_token
    var cookie = localStorage.getItem("session_token");

    //Check if we are logged in,
    //If we are then fill the subscription information
    //Needs have the according route
    if($scope.loggedIn())
    {
        $http.get('http://localhost:3000/pages/').
          success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            //Check for any errors
            if(data.error)
            {
                if(data.error.errorid == '12')
                {
                    $scope.showAlert("Alert!", "Session token is no longer valid, please login!");

                    //Set our current error
                    $scope.errors[0] = 12;

                    $scope.login();
                }
            }
            else
            {
                //Then fill the user information
                $scope.registerData.email = data.email;


                //Set our current error to none
                $scope.errors[0] = -1;
            }
          }).
          error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.

          })
    }

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
            $scope.cc.number = value;

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


    /**
     * Assembles CC info and creates a token with Stripe
     */
    $scope.tokenizeInfo = function() {
        //Disable button while tokenzing the card
        $scope.tokenzing = true;

        //Create finalized card number
        var cardNumber = $scope.cc.number;

        //Send card info to stripe for tokenization
        Stripe.card.createToken({
            "number": $scope.registerData.ccNumber,
            "cvc": $scope.registerData.cvv,
            "exp_month": $scope.registerData.expireM,
            "exp_year": $scope.registerData.expireY
        }, function(status, response) {
            if (response.error) {

                //Display card error message
                $scope.tokenizeFailure = true;
            } else {
                //Get the token to be submitted later, after the second page
                // response contains id and card, which contains additional card details
                $scope.stripeToken = response.id;
            }

            //Force the change to refresh, we need to do this because I
            //guess response scope is a different scope and has to be
            //forced or interacted with
            $scope.$apply();
        });
    };

    //Function to go back to the previous page
    $scope.goToPrev = function(){
        $ionicHistory.goBack();
    }

    //Create the user
    $scope.registerUser = function() {
        $http.post('http://localhost:3000/pages/').
          success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            //Check for any errors
            if(data.error)
            {
                if(data.error.errorid == '12')
                {
                    $scope.showAlert("Alert!", "Session token is no longer valid, please login!");

                    //Set our current error
                    $scope.errors[0] = 12;

                    $scope.login();
                }
            }
            else
            {
                //Then fill the user information
                $scope.registerData.email = data.email;


                //Set our current error to none
                $scope.errors[0] = -1;
            }
          }).
          error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.

          })
    }

    //Update the user
    $scope.updateUser = function() {
        $http.put('http://localhost:3000/pages/').
          success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            //Check for any errors
            if(data.error)
            {
                if(data.error.errorid == '12')
                {
                    $scope.showAlert("Alert!", "Session token is no longer valid, please login!");

                    //Set our current error
                    $scope.errors[0] = 12;

                    $scope.login();
                }
            }
            else
            {
                //Then fill the user information
                $scope.registerData.email = data.email;


                //Set our current error to none
                $scope.errors[0] = -1;
            }
          }).
          error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.

          })
    }

});
