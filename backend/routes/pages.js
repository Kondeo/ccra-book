var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Page = mongoose.model('Page');

/* GET page. */
router.get('/:number', function(req, res, next) {

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
            } else if(moment(user.subscription).isAfter(moment())){
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
                page.content = cleanHTML(page.content);
                page.subscription = user.subscription;
                res.status(200).json(page);
            }
        });
    }

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
});

module.exports = router;
