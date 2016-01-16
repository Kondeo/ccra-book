'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var User = new mongoose.Schema({
    name: {
        type: String
    },
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
    }
});

mongoose.model('User', User);
