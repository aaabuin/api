var connection = require('../mysql');

//sustituto del modelo usuario
let Competition = {};



Competition.findAll = () => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query("SELECT * FROM competition",
         (error, result) => {
            if (error) reject(error);
            else{ resolve(result);}
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
     });
    
}

Competition.findBy = ( key ) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('SELECT * FROM competition '+key, (error, result) => {
            if (error) reject(error);
            else resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
     });
    
}


 
Competition.findById = (id) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('SELECT * FROM competition WHERE id=?', [id], (error, result) => {
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
 




Competition.findByName = (competition) => {
    
        return new Promise( (resolve, reject) => { 
           if (connection) { 
               connection.query('SELECT * FROM competition WHERE name=? AND country_id=? AND sport_id=? ', 
            [competition.name, competition.countryId, competition.sportId], (error, result) => {
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


Competition.insert = (competition) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('INSERT INTO competition SET name=? , status=?, country_id=?, sport_id=?, user_id=?, createdAt=? ', 
        [competition.name, competition.status, competition.countryId, competition.sportId,competition.userId, competition.createdAt],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.insertId);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });
    
}


 
Competition.edit = (competition) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('UPDATE competition SET name=?, status=?, sport_id=?, country_id=? WHERE id=? ', 
        [competition.name, competition.status, competition.sportId,competition.countryId,competition.id],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });
    
}

 
Competition.delete = (competitionId,) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('DELETE FROM competition WHERE id=?', 
        [competitionId],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });
    
}

module.exports = Competition;