var keys = require('../config/keys.json'),
    stripe = require("stripe")(keys.stripe.sk);

//Checks if a token exists, and returns the corrosponding accountId
exports.charge = function(card, amount, success, fail) {
    var charge = stripe.charges.create({
        amount: amount, // amount in cents, again
        currency: "usd",
        source: card,
        description: "CCRA Compendium Subscription"
    }, function(err, charge) {
        if (err && err.type === 'StripeCardError') {
            fail({
                msg: "Card was declined!"
            });
        } else if (err) {
            console.log("Stripe charge error");
            console.log(err);
            fail({
                msg: "Charge could not be completed!"
            });
        } else {
            success(charge);
        }
    });
};

exports.createCustomer = function(card, plan, email, success, fail){
    var payload = {
      email: email
    }
    if (plan != null) payload.plan = plan;
    if (card != null) payload.source = card;
    stripe.customers.create(payload, function(err, customer) {
      if (err && err.type === 'StripeCardError') {
          fail({
              msg: "Card was declined!"
          });
      } else if (err) {
          console.log("Stripe charge error");
          console.log(err);
          fail({
              msg: "Charge could not be completed!"
          });
      } else {
          success(customer);
      }
    });
};

exports.updateCard = function(stripeId, card, success, fail){
    stripe.customers.update(stripeId, {
        source: card
    }, function(err, customer){
        if(err) fail(err);
        else success(customer);
    });
};

exports.subscribe = function(stripeId, plan, success, fail){
    stripe.subscriptions.create({
      customer: stripeId,
      plan: plan
    }, function(err, subscription) {
        if(err) fail(err);
        else success(subscription);
    });
};

exports.unsubscribe = function(subscriptionId, success, fail){
    stripe.subscriptions.del(subscriptionId, function(err, confirmation) {
      if(err) fail(err);
      else success(confirmation);
    });
};

exports.verifyEvent = function(eventId, success, fail){
  stripe.events.retrieve(eventId, function(err, event) {
    if(err) fail(err);
    else success(event);
  });
};
