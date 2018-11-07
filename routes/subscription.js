'use strict'

var express = require('express');
//var mysql_generator = require('../config/sentencias-mysql');
var moment = require('moment');
var router = express.Router();

var auth = require('../middlewares/authenticated');
var sqlGenerator = require('../config/sqlStatements');
var subscriptionDao = require('../models/subscriptionDao');
var userDao = require('../models/userDao');


router.post('/', [auth.ensureAuth], (req, res, next) => {

    var subscription = {
        id: null,
        followerId: req.body.followerId,
        tipsterId: req.body.tipsterId,
        amount: req.body.amount,
        startDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    };


    //comprobamos que existan todos los datos obligatorios
    if (!subscription.followerId || !subscription.tipsterId || !subscription.amount || !subscription.startDate) {
        return res.rest.badRequest("Missing data.");
    }

    //comprobamos que follower sea quien está logueado y que éste no se subscriba a si mismo.
    if (subscription.followerId != req.user.sub || subscription.tipsterId == req.user.sub) {
        return res.rest.badRequest("Wrong data.");
    }

    /* FALTA COMPROBAR QUE NO HAYA UNA SUBSCIPCION IGUAL ACTIVA */

    subscriptionDao.findSubscription(subscription.followerId, subscription.tipsterId).then((data) => {
        if (data && data.length == 0) {
            userDao.findById(subscription.tipsterId).then((data) => {
                if (data && data.length == 1) {
                    subscriptionDao.add(subscription).then((data) => {
                            res.rest.success(data.insertId);
                    }).catch(error => {
                        res.rest.badRequest("Could not save.");
                    }
                    );
                }
                else {
                    return res.rest.badRequest("No se encuentra el tipster al que se quiere subscribir.");
                }
            }).catch(error => {
                res.rest.badRequest("Tipster not found.");
            }
            );

        } else {
            return res.rest.badRequest("Ya existe una subscripción a ese tipster.");
        }
    }).catch(error => {
        res.rest.serverError("An error has ocurred.");
    }
    );
});


router.put('/', [auth.ensureAuth], (req, res, next) => {

    var subscription = {
        id: req.body.id,
        endDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    if (!subscription.id) {
        return res.rest.badRequest("Missing data.");
    }

    subscriptionDao.finish(subscription).then((data) => {
            res.rest.success(data);
    }).catch(error => {
        res.rest.badRequest("Could not save changes.");
    }
    );


});



//por hacer EL USUARIO AUTENTICADO HA DE SER ADMIN O UNO DE LOS MIEMBROS DE KEY
//BUSCA UNA SUBSCRIPCION DE UN USUARIO A UN TIPSTER
//DEVUELVE LA INFO SI ESTÁ ACTIVA
//0 EN CASO CONTRARIO
router.get('/active/:key', [auth.ensureAuth], (req, res, next) => {


    let params = JSON.parse(req.params.key)

    if (!params.followerId || !params.tipsterId) {
        return res.rest.badRequest("Missing data.");
    }

    subscriptionDao.findSubscription(params.followerId, params.tipsterId).then((data) => {
            if (data.length == 0) {
                res.rest.badRequest("Subscription not found.");
            }
            else {
                //extraer de data[0] la info a devolver...

                let result = {
                    id: data[0].id,
                    followerId: data[0].follower_id,
                    tipsterId: data[0].tipster_id,
                    amount: data[0].amount,
                    startDate: data[0].start_date
                }

                res.rest.success(result);
            }
    }).catch(error => {
        res.rest.serverError("An error has ocurred.");
    }
    );

});

//POR HACER 
//EL USUARIO DEBE SER EL AUTENTICADO O UN ADMIN?
//NOS DEVUELVE TODAS LAS SUBSCRIPCIONES ACTIVAS DE UN USUARIO 
router.get('/follower/:id', [auth.ensureAuth], (req, res, next) => {
    var id = JSON.parse(req.params.id);

    subscriptionDao.findByFollower(id).then((data) => {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var subscription = {
                    id: data[i].id,
                    followerId: data[i].follower_id,
                    tipsterId: data[i].tipster_id,
                    amount: data[i].amount,
                    startDate: data[i].start_date,
                    endDate: data[i].end_date
                };


                result.push(subscription);
            }
            res.rest.success(result);
    }).catch(error => {
        res.rest.serverError("An error has ocurred.");
    }
    );

});



//POR REVISAR EL USUARIO INDICADO DEBE SER EL AUTENTICADO?

//NOS DEVUELVE TODAS LAS SUBSCRIPCIONES ACTIVAS DE UN TIPSTER
//SIRVE PARA ENVIAR LAS ALERTAS

router.get('/tipster/:id', [auth.ensureAuth], (req, res, next) => {

    var id;
    if (req.params.id)
        id = JSON.parse(req.params.id);
    else {
        return res.rest.badRequest("Faltan datos obligatorios");
    }

    subscriptionDao.findByTipster(id).then((data) => {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var subscription = {
                    id: data[i].id,
                    followerId: data[i].follower_id,
                    tipsterId: data[i].tipster_id,
                    amount: data[i].amount,
                    startDate: data[i].start_date,
                    endDate: data[i].end_date
                };

                result.push(subscription);
            }
            res.rest.success(result);
    }).catch(error => {
        res.rest.serverError("An error has ocurred.");
    }
    );

});

//Nos devuelve una lista de usuarios, con los tipsters obtenidos al filtrar por usuario(seguidor) y por fecha
router.get('/followed/tipsters/:key', auth.ensureAuth, (req, res, next) => {
    var result = [];
    let k = sqlGenerator.sqlDateFilterGenerator(JSON.parse(req.params.key));
    subscriptionDao.findTipstersFollowed(k).then((data) => {
        for (var i = 0, len = data.length; i < len; i++) {
            let user = {
                id: data[i].id,
                username: data[i].username,
                password: null,
                email: data[i].email,
                avatar: data[i].avatar,
                description: data[i].description
            };
            result.push(user);
        }
        res.rest.success(result);
    }
    ).catch(error => {
        res.rest.serverError("An error has ocurred.");
    }
    );

}

);

//POR HACER REVISAR SI DEBE REQUERIRSE AUTENTICACION
//NOS DEVUELVE LA SUBSCRIPCION CON EL ID RECIBIDO
router.get('/:id', [auth.ensureAuth], (req, res, next) => {

    var id = JSON.parse(req.params.id);
    subscriptionDao.findById(id).then((data) => {
            var subscription = {};
            if (data.length > 0) {

                subscription = {
                    id: data[0].id,
                    followerId: data[0].follower_id,
                    tipsterId: data[0].tipster_id,
                    amount: data[0].amount,
                    startDate: data[0].start_date,
                    endDate: data[0].end_date
                };
            }

            res.rest.success(subscription);
    }).catch(error => {
        res.rest.serverError("An error has ocurred.");
    }
    );

});

module.exports = router;