var mongoose = require('mongoose');
var mongoosastic=require("mongoosastic");
var Schema = mongoose.Schema;

var Page = new Schema({
    number: {
        type: Number
    },
    nextnumber: {
        type: Number
    },
    content: {
        type: String,
        es_indexed: true
    },
    cleaned: {
        type: Boolean,
        default: false
    }
});

Page.plugin(mongoosastic);

var PageM = mongoose.model('Page', Page), stream = PageM.synchronize(), count = 0;

stream.on('data', function(err, doc){
    count++;
});
stream.on('close', function(){
    console.log('Indexed ' + count + ' documents.');
});
stream.on('error', function(err){
    console.log(err);
});
