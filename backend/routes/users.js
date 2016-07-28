var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    moment = require('moment'),
    crypto = require('crypto'),
    CONST = require('../config/constants.json'),
    keys = require('../config/keys.json'),
    MailService = require('../services/mailgun.js'),
    StripeService = require('../services/stripe.js'),
    SessionService = require('../services/sessions.js'),
    User = mongoose.model('User'),
    PromoCode = mongoose.model('PromoCode');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.status(404).send('Route Not Enabled');
});

router.post('/register', function(req, res) {
    if(!((req.body.cardToken || req.body.promoCode) &&
        req.body.email &&
        req.body.password)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    var cleanEmail = (req.body.email.toLowerCase()).trim();
    var emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/;
    if (!emailRegex.test(cleanEmail)) {
        res.status(406).json({
          msg: "Email is not valid!"
        });
    } else {
        //Check if a user with that username already exists
        User.findOne({
            email: cleanEmail
          })
          .select('_id')
          .exec(function(err, user) {
            if (user) {
                res.status(409).json({
                    msg: "Email taken!"
                });
            } else {
                //Create a random salt
                var salt = crypto.randomBytes(128).toString('base64');
                //Create a unique hash from the provided password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);

                if(req.body.promoCode){
                    promoReg()
                } else if(req.body.yearly) {
                    var plan = "standard";
                    if(req.body.memberUsername || req.body.memberPassword){
                        checkMembership(req.body.memberUsername, req.body.memberPassword, subYearly, function(err){
                            res.status(err.status).send(err.msg);
                        });
                    } else {
                        subYearly(false);
                    }
                } else {
                    var plan = "standard";
                    if(req.body.memberUsername || req.body.memberPassword){
                        checkMembership(req.body.memberUsername, req.body.memberPassword, subMonthly, function(err){
                            res.status(err.status).send(err.msg);
                        });
                    } else {
                        subMonthly(false);
                    }
                }

                function subYearly(isMember){
                    var price = CONST.SINGLE_PRICE.STANDARD;
                    if(isMember) {
                      price = CONST.SINGLE_PRICE.MEMBER;
                      isMember = true;
                    };

                    StripeService.charge(req.body.cardToken, price, function(charge){
                        //Create a new user with the assembled information
                        var subscriptionDate = moment().add(1, 'year');
                        var newUser = new User({
                            email: cleanEmail,
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
                                sendToken(newUser, subscriptionDate);
                            }
                        });
                    }, function(err){
                        res.status(402).json({
                            msg: "Card was declined!"
                        });
                    });
                }

                function subMonthly(isMember){
                    if(isMember) {
                      plan = "member";
                      isMember = true;
                    };

                    StripeService.createCustomer(req.body.cardToken, plan, (req.body.email.toLowerCase()).trim(), function(customer){
                        //Create a new user with the assembled information
                        var subscriptionDate = moment().add(1, 'month');
                        var newUser = new User({
                            email: cleanEmail,
                            password: hash,
                            salt: salt,
                            subscription: subscriptionDate.toDate(),
                            subscriptionId: customer.subscriptions.data[0].id,
                            stripeId: customer.id,
                            memberPrice: isMember
                        }).save(function(err, newUser) {
                            if (err) {
                              console.log("Error saving user to DB!");
                              res.status(500).json({
                                  msg: "Error saving user to DB!"
                              });
                            } else {
                                sendToken(newUser, subscriptionDate);
                            }
                        });
                    }, function(err){
                        res.status(402).json({
                            msg: "Card was declined!"
                        });
                    });
                }

                function promoReg(){
                    PromoCode.findOne({
                        promoCode: req.body.promoCode
                    }).exec(function(err, promoCode) {
                      if (!promoCode || moment(promoCode.validTo).isSameOrBefore(moment(), "day")) {
                          if(promoCode) promoCode.remove();
                          res.status(402).json({
                              msg: "PromoCode Invalid!"
                          });
                      } else {
                          promoCode.remove();

                          //Create a new user with the assembled information
                          var subscriptionDate = moment(promoCode.validTo);
                          var newUser = new User({
                              email: cleanEmail,
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
                                  sendToken(newUser, subscriptionDate);
                              }
                          });
                      }
                    });


                }

                function sendToken(newUser, subscriptionDate){
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
    .select('password salt subscription subscriptionId admin')
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
                            admin: user.admin,
                            subscriptionId: user.subscriptionId
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

router.post('/sub/add', function(req, res, next) {
    if(!((req.body.cardToken || req.body.promoCode) &&
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
    .select('password salt subscription subscriptionId stripeId')
    .exec(function(err, user) {
        if (err) {
            res.status(500).json({
                msg: "Couldn't search the database for user!"
            });
        } else if (!user) {
            res.status(401).json({
                msg: "Wrong email!"
            });
        } else if(user.subscriptionId){
            console.log("User already has active sub")
            res.status(400).json({
                msg: "Already has active subscription"
            });
        } else {
            //Hash the requested password and salt
            var hash = crypto.pbkdf2Sync(req.body.password, user.salt, 10000, 512);
            //Compare to stored hash
            if (hash == user.password) {

                if(req.body.promoCode){
                    promoRenew();
                } else {
                    var sub = monthlyRenew;
                    if(req.body.yearly) {
                        sub = yearlyRenew;
                    }

                    if(req.body.memberUsername || req.body.memberPassword){
                        checkMembership(req.body.memberUsername, req.body.memberPassword, sub, function(err){
                            res.status(err.status).send(err.msg);
                        });
                    } else {
                        sub(false);
                    }
                }

                function yearlyRenew(membership){
                    var price = CONST.SINGLE_PRICE.STANDARD;
                    if(isMember) {
                      price = CONST.SINGLE_PRICE.MEMBER;
                      isMember = true;
                    };

                    StripeService.charge(req.body.cardToken, price, function(charge){

                        var updatedUser = {};

                        var origSub = moment(user.subscription);
                        var today = moment();

                        var newSub = moment.max(origSub, today).add(1, 'year');

                        updatedUser.subscription = newSub.toDate();
                        if(user.subscriptionId) StripeService.unsubscribe(user.subscriptionId, function(confirmation){}, function(err){});

                        var setUser = {
                            $set: updatedUser,
                            $unset: { subscriptionId: 1, memberPrice: 1, stripeInit: 1 }
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
                        console.log("card declined")
                        console.log(err)
                        res.status(402).json({
                            msg: "Card was declined!"
                        });
                    });
                }

                function monthlyRenew(membership){
                    var plan = "standard";
                    isMember = membership;
                    if(isMember) {
                        plan = "member";
                        isMember = true;
                    }
                    if(user.subscriptionId){
                        StripeService.unsubscribe(user.subscriptionId, getStripeId, function(){
                            res.status(500).json({
                                msg: "Could not unsubscribe from old subscription!"
                            });
                        });
                    } else {
                        getStripeId();
                    }

                    function getStripeId(){
                        if(!user.stripeId){
                            StripeService.createCustomer(null, null, (req.body.email.toLowerCase()).trim(), function(customer){
                                newSub(customer.id);
                            }, function(err){
                                res.status(402).json({
                                    msg: "Card was declined!"
                                });
                            });
                        } else {
                            newSub(user.stripeId);
                        }
                    }

                    function newSub(stripeId){
                        StripeService.updateCard(stripeId, req.body.cardToken, function(customer){
                            StripeService.subscribe(stripeId, plan, function(subscription){

                                var updatedUser = {};

                                var origSub = moment(user.subscription);
                                var today = moment();

                                var newSub = moment.max(origSub, today).add(1, 'month');

                                updatedUser.subscription = newSub.toDate();
                                updatedUser.subscriptionId = subscription.id;
                                updatedUser.memberPrice = isMember;
                                if(!user.stripeId) updatedUser.stripeId = stripeId;

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
                                console.log("card declined")
                                console.log(err)
                                res.status(402).json({
                                    msg: "Card was declined!"
                                });
                            });
                        }, function(err){
                          console.log(err)
                            res.status(402).json({
                                msg: "Card was declined!"
                            });
                        });
                    }
                }

                function promoRenew(){
                    PromoCode.findOne({
                        promoCode: req.body.promoCode
                    }).exec(function(err, promoCode) {
                        if (!promoCode  || moment(promoCode.validTo).isSameOrBefore(moment(), "day")) {
                            if(promoCode) promoCode.remove();
                            res.status(402).json({
                                msg: "PromoCode Invalid!"
                            });
                        } else if(moment(promoCode.validTo).isSameOrBefore(moment(user.subscription), "day")){
                            res.status(418).json({
                                msg: "PromoCode Not Useful! The user's subscription is already valid past the promo date."
                            });
                        } else {
                            promoCode.remove();
                            var updatedUser = {};

                            var newSub = moment(promoCode.validTo);

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
                        }
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

router.post('/sub/cancel', function(req, res, next) {
    if(!(req.body.token)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    SessionService.validateSession(req.body.token, "user", function(accountId) {

        //Find a user with the username requested. Select salt and password
        User.findById(accountId)
        .select('subscription subscriptionId')
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
                StripeService.unsubscribe(user.subscriptionId, function(confirmation){

                    var setUser = {
                        $unset: { subscriptionId: 1, memberPrice: 1, stripeInit: 1 }
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

                    //All good, give the user their token
                    res.status(200).send("ok");
                }, function(err){
                    res.status(500).json({
                        msg: "Could not unsubscribe user!"
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
        .select('name email subscription subscriptionId memberPrice admin')
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
        res.status(406).json({
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
    var cleanEmail = (req.body.email.toLowerCase()).trim();
    //Find a user with the username requested. Select salt and password
    var emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/;
    if (!emailRegex.test(cleanEmail)) {
        res.status(406).json({
            msg: "Email is not valid!"
        });
    } else {
        //Check if a user with that username already exists
        User.findOne({
            email: cleanEmail
        })
        .select('_id')
        .exec(function(err, user) {
            if (user) {
                SessionService.generateSession(user._id, "user", function(token){
                    var messagePlain = 'Hello ' + req.body.email.toLowerCase() + ', You recently requested a password reset for your CCRA Ebook account. If you didn\'t, please ignore this email. Here is your reset link: ' + CONST.SERVER.URL + '/#/reset?token=' + token;
                    var messageHTML = 'Hello ' + req.body.email.toLowerCase() + ',<br><br> You recently requested a password reset for your CCRA Ebook account. If you didn\'t, please ignore this email. <br><br>Here is your reset link: <br> ' + CONST.SERVER.URL + '/#/reset?token=' + token;
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

router.post('/generatePromos', function(req, res) {
    if(!(req.body.count &&
        req.body.token)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    validateUser(req, res, checkAdmin);

    function checkAdmin(user){
        if(!user.admin){
            res.status(401).json({
                msg: "Not an admin!"
            });
        } else {
            generatePromoCodes();
        }
    }

    function generatePromoCodes(){
        var error = false;
        var codes = [];
        for(var i=0;i<req.body.count;i++){
            var code = crypto.randomBytes(4).toString('hex');
            codes.push(code);
            new PromoCode({
                promoCode: code,
                validTo: req.body.date || moment().add(6, 'months')
            }).save(function(err) {
                if (err) {
                  console.log("PROMO CODE SAVE ERROR")
                  error = true;
                }
            });
        }
        res.status(200).json(codes);
    }
});

function checkMembership(username, password, success, fail){
  var membership = false;

  var request = require('request');

  // Set the headers
  var headers = {
      'User-Agent':       'Super Agent/0.0.1',
      'Content-Type':     'application/x-www-form-urlencoded',
      'Authorization':    keys.memberClicks.apiKey,
      'Accept':           'application/json'
  }

  // Configure the request
  var options = {
      url: 'https://ccra.memberclicks.net/services/auth',
      method: 'POST',
      headers: headers,
      qs: {'username': username, 'password': password, 'apiKey': keys.memberClicks.apiKey}
  }

  // Start the request
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
          var data = JSON.parse(body);
          if(data.active){
            success(true);
          } else {
            fail({
              status: 424,
              msg: "CCRA Membership no longer active."
            });
          }
      } else {
          fail({
            status: 417,
            msg: "CCRA Membership credentials incorrect."
          });
      }
  });
}

function validateUser(req, res, success){
    var token = req.query.token || req.body.token;
    SessionService.validateSession(token, "user", function(accountId) {
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
            } else if(moment(user.subscription).isBefore(moment()) && !user.admin){
                res.status(402).json({
                    msg: "Subscription expired!",
                    subscription: user.subscription
                });
            } else {
                success(user);
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });
}

module.exports = router;
