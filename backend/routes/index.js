var express = require('express'),
    router = express.Router(),
    CONST = require('../config/constants.json'),
    semver = require('semver');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/prices', function(req, res, next) {
    res.status(200).json(CONST.SUBSCRIPTION_PRICE);
});

router.get('/client', function(req, res, next) {
  //CLIENT OUT OF DATE - Semver client version is less than last compat
  if(semver.lt(req.query.version, CONST.VERSION.LAST_COMPATIBLE)){ res.status(426).json(CONST.CLIENT) }
  //CLIENT BEING DEPRICATED SOON - Semver client version is less than or equal to DEPRICATED
  else if(semver.lte(req.query.version, CONST.VERSION.DEPRICATED)){ res.status(449).json(CONST.CLIENT) }
  //CLIENT VERSION OK
  else { res.status(200).json(CONST.CLIENT) }
});

module.exports = router;
