var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    moment = require('moment'),
    crypto = require('crypto'),
    CONST = require('../config/constants.json'),
    MailService = require('../services/mailgun.js'),
    StripeService = require('../services/stripe.js'),
    SessionService = require('../services/sessions.js'),
    User = mongoose.model('User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.status(404).send('Route Not Enabled');
});

router.post('/register', function(req, res) {
    if(!(req.body.cardToken &&
        req.body.email &&
        req.body.password)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    var emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/;
    if (!emailRegex.test(req.body.email)) {
        res.status(412).json({
          msg: "Email is not valid!"
        });
    } else {
        //Check if a user with that username already exists
        User.findOne({
            email: (req.body.email.toLowerCase()).trim()
          })
          .select('_id')
          .exec(function(err, user) {
            if (user) {
                res.status(406).json({
                    msg: "Email taken!"
                });
            } else {
                var plan = "test_plan";
                if(true){
                  //Decide if they are a member
                }
                StripeService.createCustomer(req.body.cardToken, plan, (req.body.email.toLowerCase()).trim(), function(customer){
                    //Create a random salt
                    var salt = crypto.randomBytes(128).toString('base64');
                    //Create a unique hash from the provided password and salt
                    var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
                    //Create a new user with the assembled information
                    var subscriptionDate = moment().add(1, 'month');
                    var newUser = new User({
                        email: (req.body.email.toLowerCase()).trim(),
                        password: hash,
                        salt: salt,
                        subscription: subscriptionDate.toDate()
                    }).save(function(err, newUser) {
                        if (err) {
                          console.log("Error saving user to DB!");
                          res.status(500).json({
                              msg: "Error saving user to DB!"
                          });
                        } else {
                            SessionService.generateSession(newUser._id, "user", function(token){
                                //All good, give the user their token
                                res.status(201).json({
                                    token: token,
                                    subscription: subscriptionDate.toDate()
                                });
                            }, function(err){
                                res.status(err.status).json(err);
                            });
                        }
                    });
                }, function(err){
                    res.status(402).json({
                        msg: "Card was declined!"
                    });
                });
            }
          });
    }
});

router.post('/login', function(req, res, next) {
    if(!(req.body.email &&
        req.body.password)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    //Find a user with the username requested. Select salt and password
    User.findOne({
        email: (req.body.email.toLowerCase()).trim()
    })
    .select('password salt subscription admin')
    .exec(function(err, user) {
        if (err) {
            res.status(500).json({
                msg: "Couldn't search the database for user!"
            });
        } else if (!user) {
            res.status(401).json({
                msg: "Wrong email!"
            });
        } else {
            //Hash the requested password and salt
            var hash = crypto.pbkdf2Sync(req.body.password, user.salt, 10000, 512);

            //Compare to stored hash
            if (hash == user.password) {
                //Check if subscription has expired
                if(moment(user.subscription).isAfter(moment()) || user.admin){
                    SessionService.generateSession(user._id, "user", function(token){
                        //All good, give the user their token
                        res.status(200).json({
                            token: token,
                            subscription: user.subscription,
                            admin: user.admin
                        });
                    }, function(err){
                        res.status(err.status).json(err);
                    });
                } else {
                    res.status(402).json({
                        msg: "Subscription expired!",
                        subscription: user.subscription
                    });
                }
            } else {
                res.status(401).json({
                    msg: "Password is incorrect!"
                });
            }
        }
    });
});

router.post('/card/add', function(req, res, next) {
    if(!(req.body.cardToken &&
        req.body.email &&
        req.body.password)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    //Find a user with the username requested. Select salt and password
    User.findOne({
        email: (req.body.email.toLowerCase()).trim()
    })
    .select('password salt subscription')
    .exec(function(err, user) {
        if (err) {
            res.status(500).json({
                msg: "Couldn't search the database for user!"
            });
        } else if (!user) {
            res.status(401).json({
                msg: "Wrong email!"
            });
        } else {
            //Hash the requested password and salt
            var hash = crypto.pbkdf2Sync(req.body.password, user.salt, 10000, 512);
            //Compare to stored hash
            if (hash == user.password) {

                var plan = "test_plan";
                if(true){
                  //Decide if they are a member
                }

                StripeService.createCustomer(req.body.cardToken, plan, (req.body.email.toLowerCase()).trim(), function(customer){

                    var updatedUser = {};

                    var origSub = moment(user.subscription);
                    var today = moment();

                    var newSub = moment.max(origSub, today).add(1, 'month');

                    updatedUser.subscription = newSub.toDate();

                    var setUser = {
                        $set: updatedUser
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

                    SessionService.generateSession(user._id, "user", function(token){
                        //All good, give the user their token
                        res.status(200).json({
                            token: token,
                            subscription: newSub.toDate()
                        });
                    }, function(err){
                        res.status(err.status).json(err);
                    });
                }, function(err){
                    res.status(412).json({
                        msg: "Card was declined!"
                    });
                });
            } else {
                res.status(401).json({
                    msg: "Password is incorrect!"
                });
            }
        }
    });
});

router.post('/card/cancel', function(req, res, next) {
    if(!(req.body.cardToken &&
        req.body.email &&
        req.body.password)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    SessionService.validateSession(req.params.token, "user", function(accountId) {

        //Find a user with the username requested. Select salt and password
        User.findById(accountId)
        .select('subscription')
        .exec(function(err, user) {
            if (err) {
                res.status(500).json({
                    msg: "Couldn't search the database for user!"
                });
            } else if (!user) {
                res.status(401).json({
                    msg: "Wrong email!"
                });
            } else {
                StripeService.charge(req.body.cardToken, CONST.SUBSCRIPTION_PRICE.RENEW, function(charge){

                    var updatedUser = {};

                    var origSub = moment(user.subscription);
                    var today = moment();

                    var newSub = moment.max(origSub, today).add(1, 'y');

                    updatedUser.subscription = newSub.toDate();

                    var setUser = {
                        $set: updatedUser
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

                    SessionService.generateSession(user._id, "user", function(token){
                        //All good, give the user their token
                        res.status(200).json({
                            token: token,
                            subscription: newSub.toDate()
                        });
                    }, function(err){
                        res.status(err.status).json(err);
                    });
                }, function(err){
                    res.status(412).json({
                        msg: "Card was declined!"
                    });
                });
            }
        });

    }, function(err){
        res.status(err.status).json(err);
    });
});

router.get('/self/:token', function(req, res, next) {
    SessionService.validateSession(req.params.token, "user", function(accountId) {
        User.findById(accountId)
        .select('name email subscription admin')
        .exec(function(err, user) {
            if (err) {
                res.status(500).json({
                    msg: "Couldn't search the database for user!"
                });
            } else if (!user) {
                res.status(401).json({
                    msg: "User not found, user table out of sync with session table!"
                });
            } else {
                res.status(200).json(user);
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });
});

/* Update user */
router.put('/self/:token', function(req, res, next) {
    var emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/;
    if (req.body.email && !emailRegex.test(req.body.email)) {
        res.status(412).json({
            msg: "Email is not valid!"
        });
    } else {
        SessionService.validateSession(req.params.token, "user", function(accountId) {
            var updatedUser = {};

            if (req.body.email && typeof req.body.email === 'string') updatedUser.email = req.body.email;
            if (req.body.password && typeof req.body.password === 'string') {
                //Create a random salt
                var salt = crypto.randomBytes(128).toString('base64');
                //Create a unique hash from the provided password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
                updatedUser.password = hash;
                updatedUser.salt = salt;
            }

            var setUser = {
                $set: updatedUser
            }

            User.update({
                _id: accountId
            }, setUser)
            .exec(function(err, user) {
                if (err) {
                    res.status(500).json({
                        msg: "Could not update user"
                    });
                } else {
                    res.status(200).json(user);
                }
            });
        }, function(err){
            res.status(err.status).json(err);
        });
    }
});

/* User forgot password */
router.post('/forgot', function(req, res, next) {
    //Find a user with the username requested. Select salt and password
    var emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/;
    if (!emailRegex.test(req.body.email)) {
        res.status(412).json({
            msg: "Email is not valid!"
        });
    } else {
        //Check if a user with that username already exists
        User.findOne({
            email: req.body.email.toLowerCase()
        })
        .select('_id')
        .exec(function(err, user) {
            if (user) {
                SessionService.generateSession(user._id, "user", function(token){
                    var messagePlain = 'Hello ' + req.body.email.toLowerCase() + ', You recently requested a password reset for your CCRA Ebook account. If you didn\'t, please ignore this email. Here is your reset link: ' + CONST.SERVER.URL + '/#/forgot/' + token;
                    var messageHTML = 'Hello ' + req.body.email.toLowerCase() + ',<br><br> You recently requested a password reset for your CCRA Ebook account. If you didn\'t, please ignore this email. <br><br>Here is your reset link: <br> ' + CONST.SERVER.URL + '/#/forgot/' + token;
                    var subject = "Your CCRA Ebook password reset link";
                    MailService.sendMail(messageHTML, messagePlain, subject, req.body.email, function(){
                        console.log("Password reset email sent to " + req.body.email + "!");
                        res.status(200).json({
                            msg: "Password reset email sent to " + req.body.email
                        });
                    }, function(err){
                        console.log("Password reset email to " + req.body.email + " failed!");
                        res.status(500).json({
                            msg: "Email server error"
                        });
                    });
                }, function(err){
                    res.status(err.status).json(err);
                });
            } else {
                res.status(404).json({
                    msg: "Email does not exist!"
                });
            }
        });
    }
});

module.exports = router;
