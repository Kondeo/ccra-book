var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');
var Page = mongoose.model('Page');
var SessionService = require('../services/sessions.js');
var User = mongoose.model('User');

/* GET page. */
router.get('/query/:terms', function(req, res, next) {
    // if(!(req.query.token)){
    //     return res.status(412).json({
    //         msg: "Route requisites not met."
    //     });
    // }
    //
    // SessionService.validateSession(req.query.token, "user", function(accountId) {
        // User.findById(accountId)
        // .select('name email subscription')
        // .exec(function(err, user) {
        //     if (err) {
        //         res.status(500).json({
        //             msg: "Couldn't search the database for user!"
        //         });
        //     } else if (!user) {
        //         res.status(401).json({
        //             msg: "User not found, user table out of sync with session table!"
        //         });
        //     } else if(moment(user.subscription).isBefore(moment()) && !user.admin){
        //         res.status(402).json({
        //             msg: "Subscription expired!",
        //             subscription: user.subscription
        //         });
        //     } else {
        //
        //     }
        // });
    // }, function(err){
    //     res.status(err.status).json(err);
    // });

    Page.search({
        query_string: {
            query: req.params.terms
        }
    }, function(results) {
        res.status(200).json(results)
    }, function(err){
        console.log(err);
        res.status(500).send("ISE: " + err);
    });
});

/* GET page. */
router.get('/:number', function(req, res, next) {
    if(!(req.query.token)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    SessionService.validateSession(req.query.token, "user", function(accountId) {
        User.findById(accountId)
        .select('name email subscription')
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
                displayPage(user);
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });

    function displayPage(user){
        Page.findOne({
            number: parseInt(req.params.number)
        }).lean().select().exec(function(err, page){
            if(err){
                res.status(500).send("There was an error");
            } if(!page){
                res.status(404).send("Page Not Found!");
            } else {
                if(!page.cleaned) page.content = cleanHTML(page.content);
                if(!user.admin) page.subscription = user.subscription;
                res.status(200).json(page);
            }
        });
    }
});

router.put('/:number', function(req, res, next) {
    if(!(req.query.token)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    SessionService.validateSession(req.query.token, "user", function(accountId) {
        User.findById(accountId)
        .select('name email subscription')
        .exec(function(err, user) {
            if (err) {
                res.status(500).json({
                    msg: "Couldn't search the database for user!"
                });
            } else if (!user) {
                res.status(401).json({
                    msg: "User not found, user table out of sync with session table!"
                });
            } else if(!user.admin){
                res.status(401).json({
                    msg: "Not an admin!"
                });
            } else {
                updatePage();
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });

    function updatePage(){
        var updatedPage = {};

        if (req.body.number && typeof req.body.number === 'number') updatedPage.number = req.body.number;
        if (req.body.nextNumber && typeof req.body.nextNumber === 'number') updatedPage.nextnumber = req.body.nextNumber;
        if (req.body.content && typeof req.body.content === 'string') updatedPage.content = req.body.content;
        updatedPage.cleaned = true;

        var setPage = {
            $set: updatedPage
        }

        Page.update({
                number: parseInt(req.params.number)
            }, setPage)
            .exec(function(err, page) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    res.status(200).send(page);
                }
            });
    }
});

router.post('/:number', function(req, res, next) {
    if(!(req.query.token)){
        return res.status(412).json({
            msg: "Route requisites not met."
        });
    }

    SessionService.validateSession(req.query.token, "user", function(accountId) {
        User.findById(accountId)
        .select('name email subscription')
        .exec(function(err, user) {
            if (err) {
                res.status(500).json({
                    msg: "Couldn't search the database for user!"
                });
            } else if (!user) {
                res.status(401).json({
                    msg: "User not found, user table out of sync with session table!"
                });
            } else if(!user.admin){
                res.status(401).json({
                    msg: "Not an admin!"
                });
            } else {
                Page.findOne({
                    number: parseInt(req.params.number)
                }).lean().select().exec(function(err, page){
                    if(err){
                        res.status(500).send("There was an error");
                    } if(page){
                        res.status(409).send("Page number already exists!");
                    } else {
                        createPage();
                    }
                });
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });

    function createPage(){
        new Page({
            number: parseInt(req.body.number),
            nextnumber: parseInt(req.body.nextNumber),
            content: req.body.content,
            cleaned: true
        }).save(function(err, page) {
            if (err) {
                console.log("Error saving page to DB!");
                res.status(500).json({
                    msg: "Error saving page to DB!"
                });
            } else {
                res.status(201).send(page);
            }
        });
    }
});

// removes MS Office generated guff
function cleanHTML(input) {
    // 1. remove line breaks / Mso classes
    var stringStripper = /(\n|\r| class=(")?Mso[a-zA-Z]+(")?)/g;
    var output = input.replace(stringStripper, ' ');
    // 2. strip Word generated HTML comments
    var commentSripper = new RegExp('<!--(.*?)-->','g');
    var output = output.replace(commentSripper, '');
    var tagStripper = new RegExp('<(/)*(meta|link|span|\\?xml:|st1:|o:|font)(.*?)>','gi');
    // 3. remove tags leave content if any
    output = output.replace(tagStripper, ' ');
    // 4. Remove everything in between and including tags '<style(.)style(.)>'
    var badTags = ['style', 'script','applet','embed','noframes','noscript'];

    for (var i=0; i< badTags.length; i++) {
    tagStripper = new RegExp('<'+badTags[i]+'.*?'+badTags[i]+'(.*?)>', 'gi');
    output = output.replace(tagStripper, '');
    }
    // 5. remove attributes ' style="..."'
    var badAttributes = ['style', 'start'];
    for (var i=0; i< badAttributes.length; i++) {
    var attributeStripper = new RegExp(' ' + badAttributes[i] + '="(.*?)"','gi');
    output = output.replace(attributeStripper, '');
    }
    output = output.replace(/     /g, ' ');
    output = output.replace(/    /g, ' ');
    output = output.replace(/   /g, ' ');
    output = output.replace(/  /g, ' ');
    output = output.replace(/text-indent:-17.95pt;/g, 'margin-left: 23.95pt;');
    return output;
}

module.exports = router;
