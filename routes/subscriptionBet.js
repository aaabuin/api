'use strict'

var express = require('express');
var sqlGenerator = require('../config/sqlStatements');
var moment = require('moment');
var router = express.Router();
var emailModule = require('../config/email');

var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/authenticated');

var subscriptionBetDao = require('../models/subscriptionBetDao');
var subscriptionPickDao = require('../models/subscriptionPickDao');
/* 
var betDao = require('../models/betDao');
var pickDao = require('../models/pickDao');
var bookieDao = require('../models/bookieDao');

*/

router.put('/email', [auth.ensureAuth], (req, res, next) => {
    //comprobamos que existan todos los datos obligatorios
    //COMPROBAMOS QUE EL ID DEL TOKEN SEA EL AUTOR DE LA APUESTA...
    /*
    if (!req.body.amount || !req.body.bookie.id || !req.body.user.id || ! req.body.bet.id) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
 
    var subsbet = {
        id: null,
        amount: req.body.amount,
        coment: req.body.coment,
        bookieId: req.body.bookie,
        userId: req.body.user,
        betId: req.body.bet.id,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: null
 
    }; 
*/

    emailModule.sendBet(req.body, (error, result) => {
        if (error) {
            return res.rest.badRequest("No se ha podido enviar el email con la apuesta.");
        } else {
            return res.rest.success(result);
        }
    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });



});




/* Inserta una apuesta seguida */

router.post('/', [auth.ensureAuth], (req, res, next) => {
    //comprobamos que existan todos los datos obligatorios
    if (!req.body.amount || !req.body.bookie.id || !req.body.user.id || !req.body.bet.id) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var subsbet = {
        id: null,
        amount: req.body.amount,
        coment: req.body.coment,
        bookieId: req.body.bookie.id,
        userId: req.body.user.id,
        betId: req.body.bet.id,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: null

    };

    if (subsbet.amount == 0) {
        return res.rest.badRequest("Stake erroneo.");
    }
    //  comprobar  BOOKIE. USER Y BET? O NO NECESARIO?
    //BET SI...
    //USER?O SUBSCRIPTION?
    subscriptionBetDao.insert(subsbet).then((data) => {
        return res.rest.success(data);
    }).catch(error => {
        return res.rest.badRequest("No se ha podido guardar.");
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

    if (!req.body.id) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var subs_bet = req.body;


    if (!subs_bet.id || !subs_bet.picks || subs_bet.picks.length < 1) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }


    subscriptionBetDao.findById(subs_bet.id).then((data) => {
        if (data[0].user_id == req.user.sub) {
            return data;
        } else
            reject("Datos o usuario erroneos.");
    }).then(
        Promise.all(subs_bet.picks.map(pick => {
            var p = {
                id: pick.id,
                result: pick.result,
                updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            return subscriptionPickDao.findById(p.id).then((result) => {
                if (result.length) {
                    return result;
                } else {
                    Promise.reject("Pick no encontrado")
                }
            }).then(() => {
                return subscriptionPickDao.resolve(p);
            }).then(() => {
                subs_bet.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
                return subscriptionBetDao.updatedAt(subs_bet);
            }).then((result) => {
                if (result == 1) {
                    Promise.resolve(subs_bet.id);
                } else {
                    Promise.reject("Ha ocurrido un error.");
                }
            });

        })).then(
            () => {
                res.rest.success(subs_bet.id)
            }
        )
    ).catch(error => {
        res.rest.serverError(error);
    });

    /*
    subscriptionPickDao.findById(pick.id).then((result) => {
        if (result.length) {
            subscriptionPickDao.resolve(p).then((result) => {
                err=0;
            }).catch(error=>{
                res.rest.serverError("Error al resolver pick.");
            });
        }else{
            err=1;
        }
    }).catch(error=>{
        res.rest.badRequest("No se ha encontrado el pick.");
    });

    }, this);

if (err == 0) {
    subs_bet.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    subscriptionBetDao.updatedAt(subs_bet).then((result) => {
        if (result == 1) {
            return res.rest.success(subs_bet.id);
        } else {
            return res.rest.badRequest("Ha ocurrido un error.");
        }
    });
} else {
    return res.rest.badRequest("Ha ocurrido un error.");
}

}else {
return res.rest.badRequest("Datos o usuario erroneos.");
}
}).catch(error=>{
res.rest.serverError("Ha ocurrido un error.");
});
    */


});




router.get('/advancedSearch/:key', [auth.ensureAuth], (req, res, next) => {
    var search = JSON.parse(req.params.key);
    let statement = "";
    statement = statementGenerator(search);
    subscriptionBetDao.findBy(statement).then((data) => {
        var result = [];
        for (var i = 0, len = data.length; i < len; i++) {

            var subscriptionBet = {
                id: data[i].id,
                amount: data[i].amount,
                coment: data[i].coment,
                bookieId: data[i].bookie_id,
                userId: data[i].user_id,
                betId: data[i].bet_id,
                createdAt: data[i].createdAt,
                updatedAt: data[i].updatedAt

            };
            result.push(subscriptionBet);
        }
        res.rest.success(result);

    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });

});

//Devuelve una lista de bookies_id ordenadas por cantidad de usos de un usuario.
router.get('/bookies/:userId', (req, res, next) => {
    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.userId;

    subscriptionBetDao.favBookies(id).then((data) => {
        var result = [];
        for (var i = 0, len = data.length; i < len; i++) {

            var favouriteBookies = {
                bookieId: data[i].bookie_id,
                userId: data[i].user_id,
                amount: data[i].amount
            };

            if (favouriteBookies.bookieId != null)
                result.push(favouriteBookies);
        }

        res.rest.success(result);
    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });
});

//Devuelve una lista de ids de competiciones  ordenadas por cantidad de usos de un usuario.
router.get('/competitions/:userId', (req, res, next) => {

    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    subscriptionBetDao.favCompetis(id).then((data) => {
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

    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });

});


//Devuelve una lista de ids de paises ordenadas por cantidad de usos de un usuario.
router.get('/countries/:userId', (req, res, next) => {

    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    subscriptionBetDao.favCountries(id).then((data) => {
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
    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });

});



//Devuelve una lista de ids de paises ordenadas por cantidad de usos de un usuario.
router.get('/sports/:userId', (req, res, next) => {

    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    subscriptionBetDao.favSports(id).then((data) => {
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
    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });
});

//Devuelve una lista con los meses en los que un usuario ha realizado apuestas.
//year-month-1  la fecha se completa con el dia uno de cada mes activo.
router.get('/activeMonths/:userId', (req, res, next) => {

    if (!req.params.userId) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }

    var id = req.params.userId;
    subscriptionBetDao.activeDates(id).then((data) => {
        var result = [];
        for (var i = 0, len = data.length; i < len; i++) {

            var activeMonth = {
                date: moment(data[i].datepick).format('YYYY-MM-DD')
            };

            result.push(activeMonth);
        }
        return res.rest.success(result);
    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });
});

router.get('/:id', (req, res, next) => {

    if (!req.params.id) {
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.id;


    subscriptionBetDao.findById(id).then((data) => {
        if (data.length == 1) {
            var subscriptionBet = {
                id: data[0].id,
                amount: data[0].amount,
                coment: data[0].coment,
                bookieId: data[0].bookie_id,
                userId: data[0].user_id,
                betId: data[0].bet_id,
                createdAt: data[0].createdAt,
                updatedAt: data[0].updatedAt
            };

            return res.rest.success(subscriptionBet);
        } else {
            return res.rest.badRequest("No se encuentra la apuesta.");
        }
    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });

});


router.put('/', [auth.ensureAuth], (req, res, next) => {


    if (!req.body.id)
        return res.rest.badRequest("Faltan datos obligatorios.");

    /*
    FALTA POR comprobar
    BOOKIE.ID.
    */
    var subscriptionBet = {
        id: req.body.id,
        bookieId: req.body.bookie.id,
        amount: req.body.amount,
        coment: req.body.coment,
        updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }


    subscriptionBetDao.edit(subscriptionBet).then((data) => {
        if (data == 1) res.rest.success(data);
        else res.rest.badRequest("No se ha modificado ninguna subscriptionBet.");

    }).catch(error => {
        res.rest.serverError("Ha ocurrido un error.");
    });

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
                    statement += aux + " " + key + " BETWEEN " + search[key][condition];
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