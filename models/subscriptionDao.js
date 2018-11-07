var connection = require('../mysql');

let Subscription = {};
/*
return new Promise( (resolve, reject) => {  
        
    });
    */
Subscription.add = (subscription) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('INSERT INTO subscription SET follower_id=?, tipster_id=?, amount=?,  start_date=?', 
        [subscription.followerId, subscription.tipsterId, subscription.amount, subscription.startDate],
		(error, result) => {
            if (error) { 
                reject(error);
            }

            else return resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
};

Subscription.finish = (subscription) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE subscription SET end_date=? WHERE id=? ', 
        [subscription.endDate, subscription.id],
		(error, result) => {
            if (error) reject(error);
            else return resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
};


Subscription.findByFollower = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription WHERE follower_id=? AND end_date IS NULL', 
        [id], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                return resolve( result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}

Subscription.findByTipster = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription WHERE tipster_id=? AND end_date IS NULL', 
        [id], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                return resolve( result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}

//PARA UN USUARIO, BUSCA QUE TIPSTERS HA SEGUIDO. PUEDE INDICARSE UNA FECHA O RANGO DE FECHAS EN CONCRETO
Subscription.findTipstersFollowed = ( key) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT user.* FROM subscription_bet,subscription_pick,event,bet,user \
        WHERE subscription_bet.id=subscription_pick.subscription_bet_id AND \
        subscription_pick.event_id=event.id AND subscription_bet.bet_id=bet.id AND bet.user_id=user.id \
         '+key+' GROUP BY bet.user_id ', (error, result) => {
            if (error){
                reject(error);  
            }
            else return resolve( result);
        });
    } else { 
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}


//COMPRUEBA SI UNA SUBSCRIPCION DE UN USUARIO A UN TIPSTER ESTÁ ACTIVA
Subscription.findSubscription = (followerId, tipsterId) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription WHERE follower_id=? AND tipster_id=? AND end_date IS NULL', 
        [followerId, tipsterId], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                return resolve( result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}


Subscription.findById = ( id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription WHERE id=?', 
        [ id ], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                return resolve( result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}




module.exports = Subscription;