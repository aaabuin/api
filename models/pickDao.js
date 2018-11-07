var connection = require('../mysql');

//sustituto del modelo usuario
let Pick = {};


Pick.findAll = () => {
    return new Promise( (resolve, reject) => {  
        return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query("SELECT * FROM pick",
         (error, result) => {
            if (error) reject(error);
            else{ resolve( result);}
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    });
    
    
}

Pick.findBy = ( key) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM pick '+key, (error, result) => {
            if (error) reject(error);
            else resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
    
}


Pick.findById = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM pick WHERE id=? ', 
        [id], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}


//Inserta un pronostico 
//devuelve el id del pronostico insertado
//en caso contrario error.
Pick.insert = (pick) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('INSERT INTO pick SET pick=?, odd=?, result=0,  event_id=?, bet_id=?, createdAt=?', 
        [pick.pick, pick.odd, pick.eventId, pick.betId, pick.createdAt],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.insertId);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}

 
Pick.resolve = (pick) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE pick SET result=? WHERE id=? ', 
        [ pick.result , pick.id ],
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



module.exports = Pick;