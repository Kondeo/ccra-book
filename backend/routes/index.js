var express = require('express'),
    router = express.Router(),
    CONST = require('../config/constants.json');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/prices', function(req, res, next) {
    res.status(200).json(CONST.SUBSCRIPTION_PRICE);
});

module.exports = router;
