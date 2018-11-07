'use strict'

var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');

var user_routes = require('./routes/user');
var sport_routes = require('./routes/sport');
var bookie_routes = require('./routes/bookie');
var country_routes = require('./routes/country');
var competition_routes = require('./routes/competition');
var event_routes = require('./routes/event');
var pick_routes = require('./routes/pick');
var bet_routes = require('./routes/bet');
var subscription_routes= require('./routes/subscription');
var subscriptionBet_routes = require('./routes/subscriptionBet');
var subscriptionPick_routes = require('./routes/subscriptionPick');

var upload_routes = require('./routes/upload');
app.use(cors());


var restResponse = require('express-rest-response');
var options = {
  showStatusCode: true,  
  showDefaultMessage: true  
};

app.use(restResponse(options));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use('/user', user_routes);
app.use('/sport', sport_routes);
app.use('/bookie', bookie_routes);
app.use('/country', country_routes);
app.use('/competition', competition_routes);
app.use('/event', event_routes);
app.use('/pick', pick_routes);
app.use('/bet', bet_routes);
app.use('/subscription', subscription_routes);
app.use('/subscriptionBet', subscriptionBet_routes);
app.use('/subscriptionPick', subscriptionPick_routes);


app.use('/upload', upload_routes);

app.get('/', function (req, res) {
  res.send('Hola Mundo! Estamos en el API del proyecto tipster.');

});

app.listen(3000);


