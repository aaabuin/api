var connection = require('../mysql');

//sustituto del modelo usuario
//usamos eventt con doble t
//event está reservado por angular
let Eventt = {};



Eventt.findAll = () => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query("SELECT * FROM event",
         (error, result) => {
            if (error) reject(error);
            else{  resolve(result);}
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
     });
    
}

Eventt.findBy = ( key) => {
    return new Promise( (resolve, reject) => {
         if (connection) {
        connection.query('SELECT * FROM event '+key, (error, result) => {
            if (error) reject(error);
            else resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
     });
   
}


Eventt.findByName = (event ) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('SELECT * FROM event WHERE name=? AND competition_id=? ', 
        [event.name, event.competitionId], (error, result) => {
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

Eventt.findById = (eventId) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('SELECT * FROM event WHERE id=?  ', 
        [eventId], (error, result) => {
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
//Inserta un usuario 
//devuelve el id del usuario insertado
//en caso contrario error.
Eventt.insert = (event) => {
    return new Promise( (resolve, reject) => {
         if (connection) {
        connection.query('INSERT INTO event SET name=? , date=?, competition_id=?, user_id=?, createdAt=? ', 
        [event.name, event.date, event.competitionId, event.userId, event.createdAt],
		(error, result) => {
            if (error) reject(error);
            else  resolve( result.insertId);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });
   
}


 
Eventt.edit = (event) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('UPDATE event SET name=?, date=?,competition_id=? WHERE id=? ', 
        [event.name, event.date, event.competitionId, event.id],
		(error, result) => {
            if (error)reject(error);
            else  resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });
    
}

 
Eventt.delete = (eventId) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('DELETE FROM event WHERE id=?', 
        [eventId],
		(error, result) => {
            if (error) reject(error);
            else  resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });
    
}

module.exports = Eventt;