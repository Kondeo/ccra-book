var mongoose = require('mongoose');
var PromoCode = new mongoose.Schema({
    promoCode: {
        type: String,
        require: "Please provide the token"
    },
    created: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('PromoCode', PromoCode);