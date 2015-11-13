var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Page = mongoose.model('Page');

/* GET page. */
router.get('/:id', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
