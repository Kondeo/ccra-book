var keys = require('../config/keys.json'),
    mailgun = require('mailgun-js')({apiKey: keys.mailgun.apiKey, domain: keys.mailgun.domain});

//Checks if a token exists, and returns the corrosponding accountId
exports.sendMail = function(html, plain, subject, recipient, success, fail) {
    var mail = mailcomposer({
        from: config.mailgun.alias,
        to: recipient,
        subject: subject,
        body: plain,
        html: html
    });

    mail.build(function(mailBuildError, message) {
        if(mailBuildError){
            fail(mailBuildError);
        } else {
            var dataToSend = {
                to: recipient,
                message: message.toString('ascii')
            };

            mailgun.messages().sendMime(dataToSend, function (sendError, body) {
                if (sendError) {
                    console.log(sendError);
                    fail(sendError);
                } else {
                    success(body);
                }
            });
        }
    });
};
