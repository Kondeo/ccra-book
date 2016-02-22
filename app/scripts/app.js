// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter',
['ionic',
'config',
'ngResource',
'cfp.hotkeys',
'ngCordova',
'ui.tinymce'])

.config(function($stateProvider,
    $urlRouterProvider, $httpProvider) {

  //Add our states to the state provider
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('app.index', {
    url: "/index",
    views: {
      'menuContent': {
        templateUrl: "templates/index.html",
        controller: 'IndexCtrl'
      }
    }
  })

  .state('app.listing', {
    url: "/listing",
    views: {
      'menuContent': {
        templateUrl: "templates/listing.html",
        controller: 'ListingCtrl'
      }
    }
  })

  .state('app.single', {
    url: "/page/:page",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/page.html",
        controller: 'PageCtrl'
      }
    }
  })

  .state('app.edit', {
    url: "/page/:page/edit",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/pageEdit.html",
        controller: 'PageEditCtrl'
      }
    }
  })

  .state('app.register', {
    url: "/register",
    cache: false,
    views: {
      'menuContent': {
        templateUrl: "templates/register.html",
        controller: 'RegisterCtrl'
      }
    }
  })

  .state('app.settings', {
    url: "/settings",
    views: {
      'menuContent': {
        templateUrl: "templates/settings.html",
        controller: 'SettingsCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/index');


  //Our http interceptor
  //Going to pass our version to our backend
  $httpProvider.interceptors.push(function($q, CONST,
  $cordovaAppVersion, $ionicPlatform) {

      //First we need to get the app version
      //if we are webview
      //Default is version 0.1.0, since it's the initial version
      var appVersion = CONST.version;
      if(ionic.Platform.isWebView()) {

          //Grab the version number from cordova
          //Wrapping in ionic platform ready as it is stated by docs
          $ionicPlatform.ready(function() {
              $cordovaAppVersion.getAppVersion().then(function(version) {

                  //Set the version
                  appVersion = version;
              });
          });
      }


      return {

       'request': function(config) {

           //Check if we are on a device (WebView is true on a device), and then if
           //We are making a backend request
           if((config.method == "GET" ||
           config.method == "POST") &&
           config.url.indexOf(CONST.apiBase) > -1) {

               //Add the version to the params
               //Need to add it to different objects depending
               //if it is a get or post request
               if(config.method == "GET") {

                   //Add it to the params
                   if(config.params) config.params.version = appVersion;
                   else {
                       config.params = {
                           version: appVersion
                       };
                   }
               }
               else {

                   //Add it to the request data
                   if(config.data) config.data.version = appVersion;
                   else {
                       config.data = {
                           version: appVersion
                       };
                   }
               }

               console.log(config);

               //Now send the request
               return config;
           }
           else {

               //Send the request
               return config;
           }
        }

      };

    });

})

.run(function($ionicPlatform) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });

});
