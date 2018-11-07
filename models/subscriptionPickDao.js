var connection = require('../mysql');

//sustituto del modelo usuario
let SubscriptionPick = {};



SubscriptionPick.findBy = ( key ) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription_pick '+key, (error, result) => {
            if (error) reject(error);
            else return resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}


SubscriptionPick.findById = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM subscription_pick WHERE id=? ', 
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


//Inserta un pronostico generado por suscripcion
//devuelve el id del pronostico insertado
//en caso contrario error.
SubscriptionPick.insert = (subscription_pick) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('INSERT INTO subscription_pick SET pick=?, odd=?, result=0,  event_id=?, subscription_bet_id=?, createdAt=?, pick_id=?', 
        [subscription_pick.pick, subscription_pick.odd, subscription_pick.eventId, subscription_pick.subscriptionBetId, subscription_pick.createdAt,subscription_pick.pickId],
		(error, result) => {
            if (error) {
                reject(error);}
            else return resolve( result.insertId);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}


SubscriptionPick.edit = (subscription_pick) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE subscription_pick SET pick=?, odd=?, updatedAt=? WHERE id=? ', 
        [ subscription_pick.pick ,subscription_pick.odd,subscription_pick.updatedAt, subscription_pick.id ],
        (error, result) => {
            if (result && result.affectedRows==1){
                return resolve( result.affectedRows); 
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

 
SubscriptionPick.resolve = (subscription_pick) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE subscription_pick SET result=?, updatedAt=? WHERE id=? ', 
        [ subscription_pick.result ,subscription_pick.updatedAt, subscription_pick.id ],
        (error, result) => {
            if (result && result.affectedRows==1){
                return resolve( result.affectedRows); 
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



module.exports = SubscriptionPick;