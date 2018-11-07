'use strict'

var express = require('express');
var sqlGenerator = require('../config/sqlStatements');
var moment = require('moment');
var router = express.Router();

var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/authenticated');

var eventDao = require('../models/eventDao');
var subscriptionPickDao = require('../models/subscriptionPickDao');


//POR HACER
//EL USUARIO QUE crea el pick ES EL REFERIDO POR EL PICK ORIGINAL O UN ADMIN
router.post('/', [auth.ensureAuth], (req, res, next) => {


    var subscriptionPick = {
        id: null,
        pick: req.body.pick,
        odd: req.body.odd,
        result: 0,
        subscriptionBetId: req.body.subscriptionBetId,
        pickId: req.body.pickId,
        eventId: req.body.event.id,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss')

    };

    //comprobamos que existan todos los datos obligatorios
    if (!subscriptionPick.pick || !subscriptionPick.odd || !subscriptionPick.eventId || !subscriptionPick.subscriptionBetId) {
        return res.rest.badRequest("Faltan datos obligatorios en algún pronóstico.");
    }

    if (subscriptionPick.odd <= 1) {
        return res.rest.badRequest("Cuota erronea.");
    }


    //comprobamos que exista el evento
    //despues guardamos
    eventDao.findById(subscriptionPick.eventId).then((data) => {
        if (data && data.length == 1) {
            subscriptionPickDao.insert(subscriptionPick).then((data) => {
                    res.rest.success(data);
            }).catch(error => 
               { 
                   res.rest.badRequest("No se ha podido guardar el pronóstico.");
                }
            );
        } else {
            return res.rest.badRequest("No se encuentra el evento indicado.");
        }
    }).catch(error => 
        res.rest.serverError("Ha ocurrido un error.")
    );
});

//POR HACER
//EL USUARIO QUE ACTUA PUEDE SER ADMIN, EL REFERIDO POR SUBSCRIPTIONPICK O BIEN EL CREADOR DEL PICK ORIGINAL
router.post('/result' , [auth.ensureAuth], (req, res, next) => {
    
    if (!req.body.id)
        return res.rest.badRequest("Faltan datos obligatorios.");

    var subcription_pick = {
        id: req.body.id,
        result: req.body.result,
        updatedAt:moment().format('YYYY-MM-DD HH:mm:ss')
    }
    subscriptionPickDao.resolve(subcription_pick).then((data) => {
            if (data == 1) return res.rest.success(data);
            else return res.rest.badRequest("Ha ocurrido un error.");
    }).catch(error => 
        res.rest.serverError("Ha ocurrido un error.")
    );

});

//EL USUARIO QUE ACTUA PUEDE SER ADMIN, EL REFERIDO POR SUBSCRIPTIONPICK
router.put('/', [auth.ensureAuth], (req, res, next) => {
    if (!req.body.id)
        return res.rest.badRequest("Faltan datos obligatorios.");

    var pick = {
        id: req.body.id,
        pick: req.body.pick,
        odd: req.body.odd,
        updatedAt:moment().format('YYYY-MM-DD HH:mm:ss')
    }


    subscriptionPickDao.edit(pick).then((data) => {
            if (data == 1) return res.rest.success(data);
            else return res.rest.badRequest("Ha ocurrido un error.");
    }).catch(error => 
        res.rest.serverError("Ha ocurrido un error.")
    );


});

router.get('/advancedSearch/:key', (req, res, next) => {

    var search = JSON.parse(req.params.key);
    let statement = "";
    statement = " WHERE " + sqlGenerator.sqlGenerator(search);


    subscriptionPickDao.findBy(statement).then((data) => {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                let subscriptionPick = {
                    id: data[i].id,
                    pick: data[i].pick,
                    odd: data[i].odd,
                    result: data[i].result,
                    eventId: data[i].event_id,
                    pickId: data[i].pick.id,
                    subscriptionBetId: data[i].subscription_bet_id

                };

                result.push(subscriptionPick);
            }
            res.rest.success(result);
    }).catch(error => 
        res.rest.serverError("Ha ocurrido un error.")
    );

});



module.exports = router;