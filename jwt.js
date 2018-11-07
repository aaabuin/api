'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = 'proyecto_tipster_aaabuin2018';

exports.createToken = function(user){

    var payload = {
        sub: user.id,
        username: user.username,
        email: user.email,
		role: user.role,
		avatar: user.avatar,
		description: user.description,
        iat: moment().unix(),
        exp: moment().add(12,'h').unix()

    } 

    return jwt.encode(payload, key);
};

