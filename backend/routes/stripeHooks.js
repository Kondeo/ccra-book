var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    StripeService = require('../services/stripe.js'),
    CONST = require('../config/constants.json'),
    User = mongoose.model('User');

/* GET home page. */
router.post('/', function(req, res, next) {

  StripeService.verifyEvent(req.body.id, function(){
      if(req.body.type == "customer.subscription.deleted"){
          console.log("User unsubscribe event")
          cancelUser(req.body.data.object.customer, req.body.data.object.id);
      }

      res.status(200).send("ok");
  }, function(err){
      console.log("FAKE API/WEBHOOK ACCESS");
      console.log(err)
      res.status(401).send("Not Allowed.");
  });
});

function cancelUser(stripeId, subscriptionId){
    User.findOne({
        stripeId: stripeId,
        subscriptionId: subscriptionId
    })
    .select('subscription subscriptionId stripeId')
    .exec(function(err, user) {
        if (err) {
            console.log("ALERT! Database error!")
            console.log(err);
        } else if (!user) {
            console.log("User already unsubscribed manually")
        } else {
            var setUser = {
                $unset: {subscriptionId: 1, memberPrice: 1 }
            }

            User.update({
                _id: user._id
            }, setUser)
            .exec(function(err, user) {
                if (err) {
                    console.log({
                        msg: "Could not update user"
                    });
                }
            });
        }
    });
}

module.exports = router;
