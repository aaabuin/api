'use strict'

exports.isAdmin = function(req, res, next){
	if(req.user.role != 5){
		return res.status(200).send({message: 'No tienes acceso a esta zona'});
	}

	next();
};