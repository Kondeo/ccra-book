var express = require('express'),
    router = express.Router(),
    StripeService = require('../services/stripe.js'),
    CONST = require('../config/constants.json');

/* GET home page. */
router.post('/', function(req, res, next) {
  // var event = JSON.parse(req.body.);
  // StripeService.verifyEvent(event.id, function(){
      console.log(req.body);
      res.status(200).send("ok");
  // }, function(){
  //     console.log("FAKE API/WEBHOOK ACCESS");
  //     res.status(401).send("Not Allowed.");
  // });
});

module.exports = router;
