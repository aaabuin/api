'use strict'

var express = require('express');
var sqlGenerator = require('../config/sqlStatements');
var moment = require('moment');
var router = express.Router();

var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/authenticated');


var betDao = require('../models/betDao');
var pickDao = require('../models/pickDao');
var bookieDao = require('../models/bookieDao');




router.post('/', [auth.ensureAuth], (req, res, next) => {
    //comprobamos que existan todos los datos obligatorios
    if (!req.body.stake || !req.body.bookie.id ||!req.body.user.id) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    if(req.user.sub!=req.body.user.id){
        return res.rest.badRequest("Usuario erroneo.");
    }

    var bet = {
        id: null,
        stake: req.body.stake,
        argument: req.body.argument,
        bookieId: req.body.bookie.id,
        userId: req.body.user.id,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: null

    };

    if (bet.stake < 0.25 || bet.stake > 10) {
        return res.rest.badRequest("Stake erroneo.");
    }


    //comprobamos que exista la casa de apuestas en la bd
    //despues guardamos
    bookieDao.findById(bet.bookieId).then((data) => {
        if (data && data.length == 1) {
            betDao.insert(bet).then((data) => {
                res.rest.success(data);
            }).catch(error=>{
                res.rest.badRequest("No se ha podido guardar el pronóstico.");
            });

        } else {
            res.rest.badRequest("No se encuentra la casa de apuestas indicada.");
        }
    }).catch(error=>{
        res.rest.badRequest("No se encuentra la casa de apuestas indicada.");
    });


});



/*
    Resolvemos algun resultado de los picks de una apuesta
    Buscamos la apuesta a resolver, 
    si se encuentra la apuesta y el usuario es el autor de la misma
    para cada pick se establece un nuevo resultado y la fecha de modificacion
    se busca y se modifica.
    Si todos los cambios en los picksresultaron exitosos se actualiza
    la fecha de modificacion de la apuesta que los contenia.
*/
router.post('/result', [auth.ensureAuth], (req, res, next) => {


    if (!req.body.bet) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var bet = req.body.bet;


    if (!bet.id || !bet.picks || bet.picks.length < 1) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }


    betDao.findById(bet.id).then((data) => {
        if (data && data[0].user_id == req.user.sub) {
            let err = 0;
            bet.picks.forEach(function (pick) {
                var p = {
                    id: pick.id,
                    result: pick.result,
                    updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
                };

                pickDao.findById(pick.id).then(( result) => {
                    //comprobamos que el resultado sea pendiente...
                    if (result && result[0].result == 0) {
                        pickDao.resolve(p).then((result) => {
                            
                        }).catch(error=>{
                            err = 1;
                            return res.rest.badRequest("Error resolviendo el pick.");
                        });
                    }else{
                        err=1;
                    }
                }).catch(error=>{
                    return res.rest.badRequest("Pick no encontrado.");
                });
            }, this);

            if (err == 0) {
                bet.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');


                betDao.updatedAt(bet).then((result) => {
                    if (result == 1) {
                         res.rest.success(bet.id);
                    } 
                }).catch(error=>{
                    res.rest.badRequest("Ha ocurrido un error.");
                });
            } else {
                return res.rest.badRequest("Ha ocurrido un error.");
            }

        } else {
            return res.rest.badRequest("Datos o usuario erroneos.");
        }
    }).catch(()=>{
        return res.rest.badRequest("Ha ocurrido un error.");
    });

});



router.get('/advancedSearch/:key', (req, res, next) => {
    var search = JSON.parse(req.params.key);
    let statement = "";
    statement = statementGenerator(search);
    
    betDao.findBy(statement).then((data)  => {
       
        
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var bet = {
                    id: data[i].id,
                    stake: data[i].stake,
                    argument: data[i].argument,
                    bookieId: data[i].bookie_id,
                    userId: data[i].user_id,
                    createdAt: data[i].createdAt,
                    updatedAt: data[i].updatedAt

                };
                result.push(bet);
            }
            res.rest.success(result);
        
    }).catch(error => 
        res.rest.serverError("Ha ocurrido un error.")
    );

    /*betDao.findBy(statement, (error, data) => {
        if (error) {
            res.rest.serverError("Ha ocurrido un error.");
        } else {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var bet = {
                    id: data[i].id,
                    stake: data[i].stake,
                    argument: data[i].argument,
                    bookieId: data[i].bookie_id,
                    userId: data[i].user_id,
                    createdAt: data[i].createdAt,
                    updatedAt: data[i].updatedAt

                };
                result.push(bet);
            }
            res.rest.success(result);
        }
    })*/

});


router.get('/myBets', [auth.ensureAuth], (req, res, next) => {
    var id = req.user.sub;
    let statement = "";
    statement = " AND bet.user_id=" + id;


    betDao.findBy(statement).then((data) => {
        
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var bet = {
                    id: data[i].id,
                    stake: data[i].stake,
                    argument: data[i].argument,
                    bookieId: data[i].bookie_id,
                    userId: data[i].user_id,
                    createdAt: data[i].createdAt,
                    updatedAt: data[i].updatedAt

                };

                result.push(bet);
            }

            res.rest.success(result);
        
    }).catch(error=>{
            res.rest.serverError("Ha ocurrido un error.");
    })

});


//Devuelve una lista de bookies_id ordenadas por cantidad de usos de un usuario.
router.get('/bookies/:userId', (req, res, next) => {
    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.userId;

    betDao.favBookies(id).then((data) => {
        
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var favouriteBookies = {
                    bookieId: data[i].bookie_id,
                    userId: data[i].user_id,
                    amount: data[i].amount
                };

                result.push(favouriteBookies);
            }

            res.rest.success(result);
        
    }).catch(error=>{
            res.rest.serverError("Ha ocurrido un error.");
    })
});

//Devuelve una lista de ids de competiciones  ordenadas por cantidad de usos de un usuario.
router.get('/competitions/:userId', (req, res, next) => {
    
    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    betDao.favCompetis(id).then((data) => {
        var result = [];
        for (var i = 0, len = data.length; i < len; i++) {

            var favouriteCompetitions = {
                competitionId: data[i].competition_id,
                userId: data[i].user_id,
                amount: data[i].amount
                //tipo: data[i].tipo??

            };

            result.push(favouriteCompetitions);
        }

        return res.rest.success(result);
        
    }).catch(error=>
        {
            res.rest.badRequest(error);
        })

});


//Devuelve una lista de ids de paises ordenadas por cantidad de usos de un usuario.
router.get('/countries/:userId', (req, res, next) => {
    
    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    betDao.favCountries(id).then((data) => {

            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var favouriteCountries = {
                    countryId: data[i].country_id,
                    userId: data[i].user_id,
                    amount: data[i].amount
                    //tipo: data[i].tipo??
                };
                result.push(favouriteCountries);
            }

            return res.rest.success(result);
        
    }).catch(error=>res.rest.serverError(error))

});



//Devuelve una lista de ids de paises ordenadas por cantidad de usos de un usuario.
router.get('/sports/:userId', (req, res, next) => {
    
    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    betDao.favSports(id).then((data) => {

            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var favouriteSports = {
                    sportId: data[i].sport_id,
                    userId: data[i].user_id,
                    amount: data[i].amount
                    //tipo: data[i].tipo??
                };
                result.push(favouriteSports);
            }
            return res.rest.success(result);
        }
    ).catch(error=>{res.rest.serverError("Ha ocurrido un error.");})
});

//Devuelve una lista con los meses en los que un usuario ha realizado apuestas.
//year-month-1  la fecha se completa con el dia uno de cada mes activo.
router.get('/activeMonths/:userId', (req, res, next) => {
    
    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    betDao.activeDates(id).then((data) => {

            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {

                var activeMonth = {
                    date:moment(data[i].datepick).format('YYYY-MM-DD')
                };

                result.push(activeMonth);
            }
            return res.rest.success(result);
        
    }).catch(
        error=>{
            res.rest.serverError("Ha ocurrido un error.");
        }
    )
});


router.get('/:id', (req, res, next) => {
        if (!req.params.id) {
            return res.rest.badRequest("Faltan datos obligatorios.");
        }
        var id = req.params.id; 
    
        betDao.findById(id).then((data) => {
            if (data.length == 1) {
                var bet = {
                    id: data[0].id,
                    stake: data[0].stake,
                    argument: data[0].argument,
                    bookieId: data[0].bookie_id,
                    userId: data[0].user_id,
                    createdAt: data[0].createdAt,
                    updatedAt: data[0].updatedAt
                };
                return res.rest.success(bet);
            } else {
                return res.rest.badRequest("No se encuentra la apuesta.");
            }
        }).catch(error=>res.rest.badRequest(error))
    });




function statementGenerator(search) {
    let statement = "";
    let aux = "";
    for (var key in search) {
        if (key == "event.date") {
            for (var condition in search[key]) {
                if (condition == "month") {
                    statement += aux + " MONTH(" + key + ")=" + search[key][condition];
                    aux = " AND";
                } else if (condition == "year") {
                    statement += aux + " YEAR(" + key + ")=" + search[key][condition];
                    aux = " AND";
                }
                else if (condition == "between") {
                    statement += aux  +" "+ key+ " BETWEEN " + search[key][condition];
                    aux = " AND";
                }
                else if (condition == "before date"){
                    statement += aux  +" "+ key+ "<=" + "'" + search[key][condition] + "'";
                    aux = " AND";
                }
                else if (condition == "after date"){
                    statement += aux  +" "+ key+ ">=" + "'" + search[key][condition] + "'";
                    aux = " AND";
                }
                   
            }
        }
        else {
            for (var condition in search[key]) {
                if (search[key][condition] !== '' && search[key][condition] !== null) {
                    statement += aux + " " + key;

                    if (condition == "is")
                        statement += "=" + search[key][condition];
                    if (condition == "is not")
                        statement += "!=" + search[key][condition];
                    if (condition == "contains")
                        statement += " LIKE '%" + search[key][condition] + "%'";
                    if (condition == "is date")
                        statement += "=" + "'" + search[key][condition] + "'";
                    if (condition == "before date")
                        statement += "<=" + "'" + search[key][condition] + "'";
                    if (condition == "after date")
                        statement += ">=" + "'" + search[key][condition] + "'";

                        aux = " AND";

                }
            }
        }
    }

    if (statement != "") {
        return " AND " + statement;
    } else {
        return "1";
    }
}



module.exports = router;