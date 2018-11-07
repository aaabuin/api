'use strict'

var express = require('express');
var sqlGenerator=require('../config/sqlStatements');
var moment = require('moment');
var router = express.Router();

var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/is_admin');

var eventDao = require('../models/eventDao');
var competitionDao = require('../models/competitionDao');

 
router.get('/',[auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {
    eventDao.findAll().then((data) => {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                let event = {
                    id: data[i].id,
                    name: data[i].name,
                    date: moment(data[i].date).format('YYYY-MM-DDTHH:mm'),
                    competitionId: data[i].competition_id,
                    userId: data[i].user_id,
                    createdAt:data[i].createdAt
                };
                result.push(event); 
            }
            res.rest.success(result);
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});



router.get('/:id', (req, res, next) => {
    
    if (!req.params.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
        var id = req.params.id;
    
        eventDao.findById(id).then((data) => {
                let event={};

                //if data no está vacio ********************************************************
                if (data.length){
                    event = {
                        id: data[0].id,
                        name: data[0].name,
                        date: moment(data[0].date).format('YYYY-MM-DDTHH:mm'),
                        competitionId: data[0].competition_id,
                        userId: data[0].user_id,
                        createdAt: data[0].createdAt

                };
                }
                res.rest.success(event);
        }).catch(error=>{
            return res.rest.serverError("Ha ocurrido un error.");
            }
        )
    });


router.post('/', [auth.ensureAuth], (req, res, next) => {

    if (!req.body.name||!req.body.date||!req.body.competition.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    if( req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var event = {
        id: null,
        name: req.body.name.trim(),
        date: moment(req.body.date).format('YYYY-MM-DDTHH:mm'),
        competitionId: req.body.competition.id,
        userId: req.user.sub,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    if(req.user.role==5){
        event.userId=0;
    }

    
    competitionDao.findById(event.competitionId).then(( data) => {
        if (data && data.length == 1) {
            eventDao.findByName (event).then((data) => {
                if (data.length == 0) {
                    eventDao.insert(event).then((data) => {
                            res.rest.success(data);
                    }).catch(error=>{
                        res.rest.badRequest("No se ha podido guardar el evento.");
                        }
                    )

                } else {
                    res.rest.badRequest("El evento introducido ya existe");
                }
            }).catch(error=>{
                
                }
            )
        } else {
            res.rest.badRequest("No se encuentra la competicion indicada.");
        }
    }).catch(error=>{

        }
    )



});

router.get('/advancedSearch/:key', (req, res, next) => {
    var search = JSON.parse(req.params.key);
    let statement = "";
    statement=" WHERE "+sqlGenerator.sqlGenerator(search);

    eventDao.findBy(statement).then((data) => {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {
                
                let event = {
                    id: data[i].id,
                    name: data[i].name,
                    date: moment(data[i].date).format('YYYY-MM-DDTHH:mm'),
                    competitionId: data[i].competition_id,
                    userId: data[i].user_id,
                    createdAt:data[i].createdAt
                };
                result.push(event);
            }
            res.rest.success(result);
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )

});
 



router.put('/', [auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {
    
    if (!req.body.id||!req.body.name||!req.body.date||!req.body.competition.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if( req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }
    
    var event = {
        id: req.body.id,
        name: req.body.name.trim(),
        date: moment(req.body.date).format('YYYY-MM-DDTHH:mm'),
        competitionId: req.body.competition.id
    };

    


    eventDao.edit(event).then((data) => {
            if (data == 1) res.rest.success(data);
            else res.rest.badRequest("No se ha modificado ninguna competición.");

    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});


router.delete('/:id', [auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {

    if (!req.params.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.id;


    eventDao.delete(id).then((data) => {
            if (data == 0) res.rest.badRequest("No se ha borrado ningún evento.");
            else res.rest.success(data);
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});

module.exports = router;