var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    moment = require('moment'),
    StripeService = require('../services/stripe.js'),
    CONST = require('../config/constants.json'),
    User = mongoose.model('User');

/* GET home page. */
router.post('/', function(req, res, next) {

  StripeService.verifyEvent(req.body.id, function(){
      if(req.body.type == "customer.subscription.deleted"){
          console.log("User unsubscribe event")
          cancelUser(req.body.data.object.customer, req.body.data.object.id);
      } else if(req.body.type == "invoice.payment_succeeded"){
        console.log(req.body);
          console.log("User paid event")
          renewUser(req.body.data.object.customer, req.body.data.object.subscription);
      }

      res.status(200).send("ok");
  }, function(err){
      console.log("FAKE API/WEBHOOK ACCESS");
      console.log(err)
      res.status(401).send("Not Allowed.");
  });
});

function renewUser(stripeId, subscriptionId){
  User.findOne({
      stripeId: stripeId,
      subscriptionId: subscriptionId
  })
  .select('subscription subscriptionId stripeId stripeInit')
  .exec(function(err, user) {
      if (err) {
          console.log("ALERT! Database error!")
          console.log(err);
      } else if (!user) {
          console.log("User not subscribed. Autosubscription error, fragmented database.");
          StripeService.unsubscribe(subscriptionId, function(confirmation){
              console.log("Unsubscribed user to fix fragmentation")
          }, function(err){
              console.log("Stripe has no record of a subscription it just sent a webhook for. This is bad.")
          });
      } else {
        if(user.stripeInit){
          var origSub = moment(user.subscription);
          var today = moment();

          var newSub = moment.max(origSub, today).add(1, 'month');

          user.subscription = newSub.toDate();
          user.save(function(err){
            if(err) console.log("User subscription update error (database)! " + err);
            else console.log("Customer subscription autoextended.");
          });
        } else {
          user.stripeInit = true;
          user.save(function(err){
            if(err) console.log("Stripe initialization error! " + err);
            else console.log("Customer initialized.");
          });
        }
      }
  });
}

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
