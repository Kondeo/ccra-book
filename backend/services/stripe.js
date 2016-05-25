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
    stripe.customers.create({
      source: card,
      plan: plan,
      email: email
    }, function(err, customer) {
      console.log(err)
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
        console.log(customer)
          success(customer);
      }
    });
};

exports.unsubscribe = function(subscriptionId, success, fail){
    stripe.subscriptions.del(subscriptionId, function(err, confirmation) {
      if(err) fail(err);
      else success(confirmation);
    });
};
