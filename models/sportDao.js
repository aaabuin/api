var connection = require('../mysql');

//sustituto del modelo usuario
let Sport = {};


Sport.findAll = () => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM sport ', (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });

    
}


Sport.findById = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM sport WHERE id=?', [id], (error, result) => {
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


/**Comprobamos si un deporte existe */
Sport.findByName = (search) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM sport WHERE name=?', [search], (error, result) => {
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

Sport.findBy = ( key ) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM sport '+key, (error, result) => {
            if (error) reject(error);
            else resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });

    
}


Sport.insert = (sport) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('INSERT INTO sport SET name=? , image=? , status=? , user_id=?, createdAt=?', 
        [sport.name, sport.image, sport.status, sport.userId,sport.createdAt],
		(error, result) => {
            if (error) reject(error);
            else resolve(result.insertId);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });

    
}


 
Sport.edit = (sport) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE sport SET name=?, image=?, status=? WHERE id=? ', 
        [sport.name, sport.image,sport.status, sport.id],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}

 
Sport.delete = (sportId) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('DELETE FROM sport WHERE id=?', 
        [sportId],
		(error, result) => {
            if (error) reject(error);
            else resolve(result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}

module.exports = Sport;