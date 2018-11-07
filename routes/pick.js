'use strict'

var express = require('express');
var sqlGenerator=require('../config/sqlStatements');
var moment = require('moment');
var router = express.Router();

var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/authenticated');

var eventDao = require('../models/eventDao');
var pickDao = require('../models/pickDao');


//POR HACER
//EL USUARIO QUE ACTUA PUEDE SER ADMIN,O BIEN EL CREADOR DEL PICK ORIGINAL
router.post('/', [auth.ensureAuth], (req, res, next) => {

    var pick = {
        id: null,
        pick: req.body.pick,
        odd: req.body.odd,
        result: 0,
        betId: req.body.betId,
        eventId: req.body.event.id,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss')

    };
    

    //comprobamos que existan todos los datos obligatorios
    if (!pick.pick||!pick.odd||!pick.eventId||!pick.betId){
        return res.rest.badRequest("Faltan datos obligatorios en algún pronóstico.");
    }

    if (pick.odd<=1||pick.stake<0.25){
        return res.rest.badRequest("Cuota o estake erroneos.");
    }
    

    //comprobamos que exista el evento
    //despues guardamos
    eventDao.findById(pick.eventId).then((data) => {
        if (data && data.length == 1) {
            pickDao.insert(pick).then((data) => {
                    res.rest.success(data);
            }).catch(error=>{
                res.rest.badRequest("No se ha podido guardar el pronóstico.");
                }
            )
        } else {
            return res.rest.badRequest("No se encuentra el evento indicado.");
        }
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});


router.get('/advancedSearch/:key', (req, res, next) => {

    var search = JSON.parse(req.params.key);
    let statement = "";
    statement=" WHERE "+sqlGenerator.sqlGenerator(search);
    

    pickDao.findBy(statement).then((data) => {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {
                
                let pick = {
                    id: data[i].id,
                    pick: data[i].pick,
                    odd:data[i].odd,
                    result:data[i].result,
                    eventId:data[i].event_id,
                    betId:data[i].bet_id,
                    createdAt:data[i].createdAt,
                    updatedAt:data[i].updatedAt
                    
                };

                result.push(pick);
            }
            
            return res.rest.success(result);
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )

});



module.exports = router;