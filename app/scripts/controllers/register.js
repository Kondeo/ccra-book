angular.module('starter')
.controller('RegisterCtrl', function($scope, $ionicHistory, $http,
    $timeout, Page, User, $state,
    loadingSpinner, Price,
    Notifications, CONST) {

    //SET OUR STRIPE KEY HERE
    Stripe.setPublishableKey(CONST.stripePK);

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
            Notifications.show("Admin Super Powers!", "Administrators and editors do not need to renew their subscription. I'll send you back to the home page", function() {

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

                $scope.autoPay = data.subscriptionId || false;

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

                //Handle the error with Notifications
                Notifications.error(response);
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

            //Handle the Notifications
            Notifications.error(response);
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

        //Simply check if there are 5 digits
        var zipText = $scope.registerData.zipCode + "";
        if (zipText.length > 4) {
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

    $scope.unsubscribe = function() {
        //Start loading
        loadingSpinner.startLoading();
        
        User.cancel({
          token: localStorage.getItem("session_token")
        }, function(){
            //Stop loading
            loadingSpinner.stopLoading();

            //User is no longer subscribed to autopay, so change interface
            $scope.autoPay = false;
        }, function(){
            //Stop loading
            loadingSpinner.stopLoading();
            Notifications.show("Error!", "Something went wrong. Please reload the app.");
        });
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

            Notifications.show("Password Error", "Please check your password and confirmed password.");
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

                    Notifications.show("Card Error", "Please check your card information.");

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
                        sessionStorage.setItem("weekAlerted", false);
                        sessionStorage.setItem("monthAlerted", false);

                        //Move them back to the index, no history
                        $ionicHistory.nextViewOptions({
                            disableBack: true
                        });
                        $state.go('app.index');

                        //Alert them of success!
                        Notifications.show("Success!", "You have successfully registered! Your account is valid for a year (valid unitl: " + moment(data.subscription).format("MMM Do, YYYY") + "), and can be extended. Enjoy!");

                    },
                    //Errors
                    function(response) {

                        //Our custom Error Handler
                        var handlers = [
                            {
                                status: 406,
                                title: "Email Taken",
                                text: "Sorry, that email has been taken. Please enter another email!",
                                callback: function() {

                                    //Ng class red email text
                                    $scope.emailError = true;
                                }
                            },
                            {
                                status: 402,
                                title: "Card was declined",
                                text: "Please check your card information.",
                                callback: function() {

                                    //Display alert, and show card errors
                                    $scope.cardError = true;
                                }
                            }
                        ]

                        //Send to the notification handler
                        Notifications.error(response, handlers);
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

                //Show an error for the card
                Notifications.show("Card Error", "Please check your card information.");

                //Display alert
                $scope.cardError = true;

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
                User.resub(payload, function(data) {

                    //Stop loading
                    loadingSpinner.stopLoading();

                    //Success!
                    //save their session
                    localStorage.setItem("session_token", data.token);

                    //Save them as non administrator
                    localStorage.removeItem("admin");

                    //Save their subscription Date
                    localStorage.setItem("subscriptionDate", data.subscription);
                    sessionStorage.setItem("weekAlerted", false);
                    sessionStorage.setItem("monthAlerted", false);

                    //Move them back to the index, no history
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    $state.go('app.index');

                    //Alert them of success!
                    Notifications.show("Success!", "You have successfully registered! Your account is valid for a year (valid unitl: " + moment(data.subscription).format("MMM Do, YYYY") + "), and can be extended. Enjoy!");

                },
                //Errors
                function(response) {

                    //Our handler for our notifications
                    var handlers = [
                        {
                            status: 401,
                            title: "Authentication Error",
                            text: "Please check your email and password.",
                            callback: function() {

                                //show red ng class text
                                $scope.emailError = true;
                                $scope.passwordError = true;
                            }
                        },
                        {
                            status: 402,
                            title: "Card was declined",
                            text: "Please check your card information.",
                            callback: function() {

                                //Display alert, and show card errors
                                $scope.cardError = true;
                            }
                        }
                    ];

                    //Send to our notification handler
                    Notifications.error(response, handlers);
               });
            }

            //Force the change to refresh, we need to do this because I
            //guess response scope is a different scope and has to be
            //forced or interacted with
            $scope.$apply();
        });
    }

});
