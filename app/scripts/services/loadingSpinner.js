angular.module('starter')
.service('loadingSpinner', function() {

    //Boolean if are loading
    var loading = false;

    return {

        //Needs to be a function,
        //or else will not update across controllers
        isLoading: function() {
            if(loading) return true
            else return false
        },

        startLoading: function() {

            //First, make the body non interactable
            document.body.class = document.body.class + " noTouch";

            loading = true;
            return true;
        },

        stopLoading: function() {

            //First, make the body interactable again
            document.body.class = document.body.class.replace(" noTouch", "");

            loading = false;
            return false;
        }
    };
})
