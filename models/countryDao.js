var connection = require('../mysql');

//sustituto del modelo usuario
let Country = {};



Country.findAll = () => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('SELECT * FROM country', (error, result) => {
            if (error) reject(error);
            else{  resolve( result);}
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
     });
    
}


Country.findByName = (search) => { 
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('SELECT * FROM country WHERE name=?', [search], (error, result) => {
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


Country.findById = (id) => {
    return new Promise( (resolve, reject) => { 
        if (connection) {
        connection.query('SELECT * FROM country WHERE id=?', [id], (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve( result);
            }
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }});
    
}


Country.findBy = ( key) => {
    return new Promise( (resolve, reject) => {
         if (connection) {
        connection.query('SELECT * FROM country '+key, (error, result) => {
            if (error) reject(error);
            else  resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }});
    
}



Country.insert = (country) => {
    return new Promise( (resolve, reject) => { 
        if (connection) {
        connection.query('INSERT INTO country SET name=? , image=? , status=?, user_id=?, createdAt=? ', 
        [country.nombre, country.image, country.status, country.userId, country.createdAt],
		(error, result) => {
            if (error) reject(error);
            else  resolve( result.insertId);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}


 
Country.edit = (country) => {
    return new Promise( (resolve, reject) => { 
        if (connection) {
        connection.query('UPDATE country SET name=?, image=?, status=? WHERE id=? ', 
        [country.name, country.image,country.status,country.id],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });

    
}

 
Country.delete = (countryId) => {
    return new Promise( (resolve, reject) => {
        if (connection) {
        connection.query('DELETE FROM country WHERE id=?', 
        [countryId],
		(error, result) => {
            if (error) reject(error);
            else resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
     });

    
}

module.exports = Country;