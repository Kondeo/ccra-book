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
