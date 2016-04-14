var mongoose = require('mongoose');
var keys = require('../config/keys.json');
var url = "mongodb://" + keys.database.username + ":" + keys.database.password + "@localhost/ccra-book"
mongoose.connect('mongodb://localhost/ccra-book');
