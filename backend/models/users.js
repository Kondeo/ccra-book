'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var User = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
    },
    salt: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    subscription: {
        type: Date,
        default: null
    },
    subscriptionId: {
        type: String
    },
    stripeId: {
        type: String
    },
    stripeInit: {
        type: Boolean,
        default: false
    },
    memberPrice: {
        type: Boolean,
        default: false
    },
    admin: {
        type: Boolean,
        default: false
    }
});

mongoose.model('User', User);
