'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_del_curso_de_angular4avanzado';
var key = 'proyecto_tipster_aaabuin2018';

exports.ensureAuth = function(req, res, next){
	if(!req.headers.authorization){
		return res.status(403).send({message: 'La petición no tiene token'});
	}

	var token = req.headers.authorization.replace(/['"]+/g, '');

	try{
		var payload = jwt.decode(token, key);

		if(payload.exp <= moment().unix()){
			return res.status(401).send({
				message: 'El token ha expirado'
			});
		}
	}catch(ex){
		return res.status(401).send({
			message: 'El token no es válido o ha expirado.'
			
		});
	}

	req.user = payload;
	next();
};


