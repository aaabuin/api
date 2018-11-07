var connection = require('../mysql');

//sustituto del modelo usuario
let Bookie = {};


//devuelve todas
Bookie.findAll = () => {
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT * FROM bookie ', (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        } else {
            reject('No se ha podido conectar con la base de datos');
        }
    });
    
}



Bookie.findByName = (search) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT * FROM bookie WHERE name=?', [search], (error, result) => {
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


Bookie.findById = (id) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT * FROM bookie WHERE id=?', [id], (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve( result);
                }
            });
        } else {
            reject("No se ha podido conectar con la base de datos.");
        }
    });
        

}


Bookie.findBy = ( key ) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
            connection.query('SELECT * FROM bookie '+key, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        } else {
            reject('No se ha podido conectar con la base de datos');
        }
    });
        
    
}


Bookie.insert = (bookie) => {

    return new Promise( (resolve, reject) => {
       if (connection) {
        connection.query('INSERT INTO bookie SET name=? , image=? , status=? , user_id=?, createdAt=?', 
        [bookie.name, bookie.image, bookie.status, bookie.userId, bookie.createdAt],
		(error, result) => {
            if (error)  reject(error);
            else  resolve( result.insertId);
        });
    } else {
         reject('No se ha podido conectar con la bd');
    } 
     });
    
}


 
Bookie.edit = (bookie) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('UPDATE bookie SET name=?, image=?, status=? WHERE id=? ', 
        [bookie.name, bookie.image,bookie.status, bookie.id],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });
    
}

 
Bookie.delete = (bookieId) => {
    return new Promise( (resolve, reject) => {

    if (connection) {
        connection.query('DELETE FROM bookie WHERE id=?', 
        [bookieId],
		(error, result) => {
            if (error)  reject(error);
            else resolve( result.affectedRows);
        });
    } else {
         reject('No se ha podido conectar con la bd');
    }
     });
    
}

module.exports = Bookie;