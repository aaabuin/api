var connection = require('../mysql');

let Bet = {};



Bet.findAll = () => {
    return new Promise ((resolve,reject)=>{
        if (connection) {
            connection.query("SELECT * FROM bet",
             (error, result) => {
                if (error)  resolve(error);
                else{  reject(null, result);}
            });
        } else {
            reject('No se ha podido conectar con la base de datos');
        }
    })
    
}


//bet.user_id=10
//pick.pick
//event.date>='2018-12-30'
/*Bet.findBy = ( key ,callback) => {
    if (connection) {
        connection.query('SELECT bet.* FROM bet,pick,event,competition,country,sport WHERE bet.id=pick.bet_id AND \
            pick.event_id=event.id AND event.competition_id=competition.id AND competition.country_id=country.id AND competition.sport_id=sport.id \
            '+key+' GROUP BY bet.id ', (error, result) => {
            if (error){
               return callback(error);  
            }
            else return callback(null, result);
        });
    } else {
        return callback('No se ha podido conectar con la base de datos');
    }
}*/

Bet.findBy = ( key ) => {
    return new Promise( (resolve, reject) =>{
        if (connection) {
            connection.query('SELECT bet.* FROM bet,pick,event,competition,country,sport WHERE bet.id=pick.bet_id AND \
                pick.event_id=event.id AND event.competition_id=competition.id AND competition.country_id=country.id AND competition.sport_id=sport.id \
                '+key+' GROUP BY bet.id ', (error, result) => {
                if (error){
                   reject(error);  
                }
                else resolve(result);
            });
        } else {
            return reject('No se ha podido conectar con la base de datos');
        }
    } );
    
}

Bet.findById = (id) => {
    return new Promise( (resolve, reject) => {

        if (connection) {
            connection.query('SELECT * FROM bet WHERE id=? ', 
            [id], (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
        } else {
            return reject('No se ha podido conectar con la base de datos');
        }

    });
}


//Inserta un Apuesta 
//devuelve el id del Apuesta insertado
//en caso contrario error.
Bet.insert = (bet) => {
    return new Promise( (resolve, reject) => {
    if (connection) {
            connection.query('INSERT INTO bet SET stake=?, argument=?, bookie_id=?,  user_id=?, createdAt=?', 
            [bet.stake, bet.argument, bet.bookieId, bet.userId,bet.createdAt],
            (error, result) => {
                if (error) { 
                    reject(error);
                }

                else resolve( result.insertId);
            });
        } else {
            reject('No se ha podido conectar con la bd');
        }
    });
    
}


//DEVUELVE UN LISTADO CON LOS IDS DE LAS BOOKIES
//USADAS EN LAS APUESTAS

Bet.favBookies = (id )=>{
    return new Promise( (resolve, reject) => {
        if (connection) {
                connection.query('SELECT bookie_id, user_id, count(*) as amount FROM bet WHERE user_id=? GROUP BY bookie_id ORDER BY amount DESC', 
                [id],
                (error, result) => {
                    if (error) { 
                         reject(error);
                    }

                    else {
                         resolve( result);}
                });
            } else {
                 reject('No se ha podido conectar con la bd');
            }
    });
    
}


Bet.favCompetis = (id)=>{
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT event.competition_id AS competition_id, bet.user_id AS user_id, count(*) as amount FROM pick,\
                bet, event WHERE bet.id=pick.bet_id AND pick.event_id=event.id AND bet.user_id=? \
                GROUP BY event.competition_id ORDER BY amount DESC', 
            [id],
            (error, result) => {
                if (error) { 
                    reject(error);
                }

                else {
                    resolve(result);}
            });
        } else {
            reject('No se ha podido conectar con la bd');
        }
    });
    
}

Bet.favCountries = (id)=>{
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT competition.country_id AS country_id, bet.user_id AS user_id, count(*) as amount FROM pick, bet, event, competition\
            WHERE bet.id=pick.bet_id AND pick.event_id=event.id AND event.competition_id=competition.id AND bet.user_id=? GROUP BY competition.country_id \
            ORDER BY amount DESC', 
            [id],
            (error, result) => {
                if (error) { 
                    return reject(error);
                }
                else {
                    return resolve( result);}
            });
        } else {
            reject('No se ha podido conectar con la bd');
        }
    });
    
}

Bet.favSports = (id)=>{
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT competition.sport_id AS sport_id, bet.user_id AS user_id, count(*) as amount FROM pick, bet, event, competition\
            WHERE bet.id=pick.bet_id AND pick.event_id=event.id AND event.competition_id=competition.id AND bet.user_id=? GROUP BY competition.sport_id \
            ORDER BY amount DESC', 
            [id],
            (error, result) => {
                if (error) { 
                    reject(error);
                }
                else {
                    resolve( result);}
            });
        } else {
            reject('No se ha podido conectar con la bd');
        }
    });
    
}

Bet.updatedAt=(bet)=>{
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('UPDATE bet SET updatedAt=? WHERE id=? ', 
            [bet.updatedAt, bet.id],
            (error, result) => {
                if (error) reject(error);
                else resolve( result.affectedRows);
            });
        } else {
            reject('No se ha podido conectar con la bd');
        }
    });
    
}

Bet.activeDates= (id)=>{
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT STR_TO_DATE(CONCAT(YEAR(event.date),",",MONTH(event.date),",",1) ,"%Y,%m,%d") AS datepick \
                FROM pick,bet,event \
                WHERE pick.event_id=event.id AND pick.bet_id=bet.id AND bet.user_id=?\
                GROUP BY datepick ORDER BY datepick DESC', 
            [id],
            (error, result) => {
                if (error) { 
                    reject(error);
                }
                else {
                    resolve( result);}
            });
        } else {
            reject('No se ha podido conectar con la bd');
        }
    });
    
}
module.exports = Bet;