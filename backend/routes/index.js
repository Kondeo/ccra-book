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

router.get('/client', function(req, res, next) {
  //CLIENT OUT OF DATE
  if(req.query.build < CONST.VERSION.LAST_COMPATIBLE){ res.status(426).json(CONST.CLIENT) }
  //CLIENT BEING DEPRICATED SOON
  else if(req.query.build <= CONST.VERSION.DEPRICATED){ res.status(449).json(CONST.CLIENT) }
  //CLIENT VERSION OK
  else { res.status(200).json(CONST.CLIENT) }
});

module.exports = router;
