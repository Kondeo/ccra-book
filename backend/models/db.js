var mongoose = require('mongoose');
var keys = require('../config/keys.json');
mongoose.connect('mongodb://localhost/ccra-book', {
  user: keys.database.username,
  pass: keys.database.password
});
