var connection = require('../mysql');

let SubscriptionBet = {};


SubscriptionBet.findAll = () => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query("SELECT * FROM subscription_bet",
         (error, result) => {
            if (error) reject(error);
            else{ resolve( result);}
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}


//bet.user_id=10
//pick.pick
//event.date>='2018-12-30'

SubscriptionBet.findBy = ( key ) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT subscription_bet.* FROM subscription_bet,subscription_pick,event,competition,country,sport,bet WHERE subscription_bet.id=subscription_pick.subscription_bet_id AND \
            subscription_pick.event_id=event.id AND event.competition_id=competition.id AND competition.country_id=country.id AND competition.sport_id=sport.id AND subscription_bet.bet_id=bet.id\
            '+key+' GROUP BY subscription_bet.id ', (error, result) => {
            if (error){
                reject(error);  
            }
            else resolve( result);
        });
    } else { 
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}


SubscriptionBet.findById = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription_bet WHERE id=? ', 
        [id], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve( result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}

/*
SubscriptionBet.findByOriginalBetId = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription_bet WHERE bet_id=? ', 
        [id], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve( result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}
*/


SubscriptionBet.activeDates= (id)=>{
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT STR_TO_DATE(CONCAT(YEAR(event.date),",",MONTH(event.date),",",1) ,"%Y,%m,%d") AS datepick \
            FROM subscription_pick,subscription_bet,event \
            WHERE subscription_pick.event_id=event.id AND subscription_pick.subscription_bet_id=subscription_bet.id AND subscription_bet.user_id=?\
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





//DEVUELVE UN LISTADO CON LOS IDS DE LAS BOOKIES
//USADAS EN LAS APUESTAS

SubscriptionBet.favBookies = (id)=>{
    return new Promise( (resolve, reject) => {  
        if (connection) {
            connection.query('SELECT bookie_id, user_id, count(*) as amount FROM subscription_bet WHERE user_id=? GROUP BY bookie_id ORDER BY amount DESC', 
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
    
    
    SubscriptionBet.favCompetis = (id)=>{
        return new Promise( (resolve, reject) => {  
            if (connection) {
                connection.query('SELECT event.competition_id AS competition_id, subscription_bet.user_id AS user_id, count(*) as amount FROM subscription_pick,\
                subscription_bet, event WHERE subscription_bet.id=subscription_pick.subscription_bet_id AND subscription_pick.event_id=event.id AND subscription_bet.user_id=? \
                    GROUP BY event.competition_id ORDER BY amount DESC', 
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
    
    SubscriptionBet.favCountries = (id)=>{
        return new Promise( (resolve, reject) => {  
            if (connection) {
                connection.query('SELECT competition.country_id AS country_id, subscription_bet.user_id AS user_id, count(*) as amount FROM subscription_pick, subscription_bet, event, competition\
                WHERE subscription_bet.id=subscription_pick.subscription_bet_id AND subscription_pick.event_id=event.id AND event.competition_id=competition.id AND subscription_bet.user_id=? GROUP BY competition.country_id \
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
    
    SubscriptionBet.favSports = (id)=>{
        return new Promise( (resolve, reject) => {  
            if (connection) {
                connection.query('SELECT competition.sport_id AS sport_id, subscription_bet.user_id AS user_id, count(*) as amount FROM subscription_pick, subscription_bet, event, competition\
                WHERE subscription_bet.id=subscription_pick.subscription_bet_id AND subscription_pick.event_id=event.id AND event.competition_id=competition.id AND subscription_bet.user_id=? GROUP BY competition.sport_id \
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

    


//Inserta una apuesta de una suscripcion 
//devuelve el id de la apuesta insertada
//en caso contrario error.
SubscriptionBet.insert = (sBet) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('INSERT INTO subscription_bet SET bet_id=?, amount=?, coment=?, bookie_id=?,  user_id=?, createdAt=?', 
        [sBet.betId, sBet.amount, sBet.coment, sBet.bookieId, sBet.userId,sBet.createdAt],
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


SubscriptionBet.edit = (subscription_bet) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE subscription_bet SET amount=?, coment=?, bookie_id=? , updatedAt=? WHERE id=? ', 
        [ subscription_bet.amount ,subscription_bet.coment,subscription_bet.bookieId ,subscription_bet.updatedAt, subscription_bet.id ],
        (error, result) => {
            if (result && result.affectedRows==1){
                resolve( result.affectedRows); 
            } 
            else{
                reject("Error resolviendo pronóstico"); 
            }
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}

SubscriptionBet.updatedAt=(bet)=>{
    return new Promise( (resolve, reject) => {  
         if (connection) {
            connection.query('UPDATE subscription_bet SET updatedAt=? WHERE id=? ', 
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

module.exports = SubscriptionBet;