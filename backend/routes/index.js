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
  var status = 200;
  //CLIENT OUT OF DATE - Semver client version is less than last compat
  if(semver.lt(req.query.version, CONST.VERSION.LAST_COMPATIBLE)){
    status = 426;
  }
  //CLIENT BEING DEPRICATED SOON - Semver client version is less than or equal to DEPRICATED
  else if(semver.lte(req.query.version, CONST.VERSION.DEPRICATED)){
    status = 449;
  }
  //CLIENT VERSION OK
  else {
    status = 200;
  }
  sendClient(req.query.version, status);
});

function sendClient(version, status){
  var custClient = CONST.CLIENTVER.indexOf(version);
  if(custClient > -1){
    res.status(status).json(CONST.CLIENTVER[custClient]);
  } else {
    res.status(status).json(CONST.CLIENT);
  }
}

module.exports = router;
