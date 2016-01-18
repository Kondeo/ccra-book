var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Page = new Schema({
    number: {
        type: Number
    },
    nextnumber: {
        type: Number
    },
    content: {
        type: String
    },
    cleaned: {
        type: Boolean,
        default: false
    }
});

mongoose.model('Page', Page);
