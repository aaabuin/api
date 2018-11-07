'use strict'

var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/is_admin');
var sqlGenerator=require('../config/sqlStatements');
var moment = require('moment');

var competitionDao = require('../models/competitionDao');
var sportDao = require('../models/sportDao');
var countryDao = require('../models/countryDao');


router.get('/',[auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {
    competitionDao.findAll().then((data) => {
        
        var result= [];
            for (var i = 0, len = data.length; i < len; i++) {

                let competition={
                    id:data[i].id,
                    name:data[i].name,
                    status:data[i].status,
                    countryId:data[i].country_id,
                    sportId:data[i].sport_id,
                    userId:data[i].user_id,
                    createdAt:data[i].createdAt
                };
                
                result.push(competition);
            }

            res.rest.success(result);
        
    }).catch(error=>{
        res.rest.serverError("Ha ocurrido un error.");
    });
});



router.get('/:id', (req, res, next) => {

    if (!req.params.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.id;

    competitionDao.findById(id).then((data) => {
            let competition={};
            if(data.length){
                competition={
                    id:data[0].id,
                    name:data[0].name,
                    status:data[0].status,
                    countryId:data[0].country_id,
                    sportId:data[0].sport_id,
                    userId:data[0].user_id,
                    createdAt:data[0].createdAt,
                };  
            }

            res.rest.success(competition);
        
    }).catch(error=>{
        res.rest.serverError("Ha ocurrido un error.");
    });
});





router.get('/advancedSearch/:key', (req, res, next) => {

    var search = JSON.parse(req.params.key);
    let statement="";
    
    statement=" WHERE "+sqlGenerator.sqlGenerator(search);

    competitionDao.findBy( statement ).then((data) => {
        
            var result= [];
            for (var i = 0, len = data.length; i < len; i++) {

                let competition={
                    id:data[i].id,
                    name:data[i].name,
                    status:data[i].status,
                    countryId:data[i].country_id,
                    sportId:data[i].sport_id,
                    userId:data[i].user_id,
                    createdAt:data[i].createdAt,
                };
                
                result.push(competition);
            }

            res.rest.success(result);
        
    }).catch(error=>{
        res.rest.serverError("Ha ocurrido un error.");
    });

});




router.put('/', [auth.ensureAuth, adminAuth.isAdmin] ,(req, res, next) => {

    if (!req.body.id||!req.body.name||!req.body.sport.id||!req.body.country.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if( req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }


    var competition = {
        id: req.body.id,
        name: req.body.name.trim(),
        status: req.body.status,
        sportId: req.body.sport.id,
        countryId: req.body.country.id
    };

    
    competitionDao.edit(competition).then(( data) => {
        if (data==1)res.rest.success(data);
        else res.rest.badRequest("No se ha modificado ninguna competición.");
    }).catch(error=>{
        res.rest.serverError("Ha ocurrido un error.");
    });
});



router.post('/',[auth.ensureAuth], (req, res, next) => {

    if (!req.body.name||!req.body.country.id||!req.body.sport.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    if( req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }



    var competition = {
        id: null, 
        name: req.body.name.trim(),
        status: req.body.status,
        countryId: req.body.country.id,
        sportId: req.body.sport.id,
        userId: req.user.sub,
        createdAt:  moment().format('YYYY-MM-DD HH:mm:ss')
    };

    if(req.user.role==5){
        competition.status=1;
    }

    
    countryDao.findById(competition.countryId).then((data) => {
        if (data.length == 1) {

            sportDao.findById(competition.sportId).then(( data) => {
                if (data.length == 1) {

                    //comprobamos si existe la competicion
                    competitionDao.findByName(competition).then((data) => {
                        if (data.length == 0) {
                            competitionDao.insert(competition).then(( data) => {
                                    res.rest.success(data);
                            }).catch(error=>{
                                res.rest.badRequest("No se ha podido guardar la nueva competicion");
                            });

                        }else{
                            res.rest.badRequest("La competicion introducida ya existe");
                        }

                    }).catch(error=>{
        
                    });

                }else{
                    res.rest.badRequest("No se encuentra el deporte indicado.");
                }
            }).catch(error=>{
        
            });
        }else{
            res.rest.badRequest("No se encuentra el pais indicado.");
        }
    }).catch(error=>{
        
    });
});



router.delete('/:competitionId',[auth.ensureAuth, adminAuth.isAdmin],(req, res, next)=>{
    if (!req.params.competitionId){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
        var id=req.params.competitionId;
    
        competitionDao.delete(id).then((data) => {
            if (data==0)res.rest.badRequest("No se ha borrado ningúna competicion.");
            else res.rest.success(data);
        }).catch(error=>{
        
            res.rest.serverError("Ha ocurrido un error.");
    });
});




module.exports = router;