var express = require('express');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

if (fs.existsSync("./config/keys.json")) {
    console.log("keys.json found");
} else {
    var content = fs.readFileSync('./config/keys-template.json');
    fs.writeFileSync('./config/keys.json', content);
}

//Database
var mongo = require('mongodb');
var db = require('./models/db');
var pages = require('./models/pages');
var sessions = require('./models/sessions');
var users = require('./models/users');
var promoCodes = require('./models/promoCodes');

//Routes
var routes = require('./routes/index');
var users = require('./routes/users');
var pages = require('./routes/pages');
var stripeHooks = require('./routes/stripeHooks');

var app = express();

//Use cors for cross origin support
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/pages', pages);
app.use('/stripe', stripeHooks);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
