var connection = require('../mysql');
var bcrypt = require('bcrypt-nodejs');


//sustituto del modelo usuario
let User = {};

//Comprueba un nombre de usuario,
// si lo encuentra,Devuelve el usuario
//Si no, devuelve vacio.

User.findByUsername = (username) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM user WHERE username=?', [username], (error, result) => {
            if (error) reject(error);
            
            else return resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}


//Comprueba un id de usuario,
// si lo encuentra,Devuelve el usuario
//Si no, devuelve vacio.
User.findById = (id) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM user WHERE id=?', [id], (error, result) => {
            if (error) reject(error);
            else return resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la base de datos');
    }
    });
    
}



//Comprueba si existe un email de usuario, si lo encuentra
//Devuelve el usuario
//Si no, devuelve vacio.
User.findByEmail = (email) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('SELECT * FROM user WHERE email=?', [email], (error, result) => {
            if (error) reject(error);
            else return resolve( result);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}


//Inserta un usuario 
//devuelve el id del usuario insertado
//en caso contrario error.
User.insert = (user) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('INSERT INTO user SET username=? , password=? , email=?, role=0 ', 
        [user.username, bcrypt.hashSync(user.password), user.email],
		(error, result) => {
            if (error) reject(error);
            else return resolve( result.insertId);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}


 /*/
 actualiza un usuario en la bd - campos opcionales
 devuelve el numero de filas afectadas o error*/
User.editUser = (user) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE user SET description=? WHERE id=? ', 
        [user.description, user.id],
		(error, result) => {
            if (error) reject(error);
            else return resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}

 /*/
 actualiza un usuario en la bd - password
 devuelve el numero de filas afectadas o error*/
User.updatePassword = (id,newPassword) =>{
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE user SET password=? WHERE id=?', 
        [bcrypt.hashSync(newPassword),id],
		(error, result) => {
            if (error) reject(error);
            else return resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}


 /*/
 actualiza un usuario en la bd - imagen de usuario
 devuelve el numero de filas afectadas o error*/
User.updateUserImage = (id, image) =>{
    return new Promise( (resolve, reject) => {  
        if (connection) {
        connection.query('UPDATE user SET avatar=? WHERE id=?', 
        [image,id],
		(error, result) => {
            if (error) reject(error);
            else return resolve( result.affectedRows);
        });
    } else {
        reject('No se ha podido conectar con la bd');
    }
    });
    
}



//recibe un nombre de usuario y una contraseña
//busca un usuario con ese nombre
//compara sus password y si coincide devuelve el usuario
User.checkPassword = (username, password) => {
    return new Promise( (resolve, reject) => {  
        if (connection) {
        
        User.findByUsername(username, (error, data )=> { 
            if (data&&data.length==1){
                if (bcrypt.compareSync(password, data[0].password)){
					res=data[0];
                    return resolve( res);
                }else
                {
                    reject("Contraseña incorrecta");
                }
            }else
            {
                reject("Usuario no encontrado");
            }

            if (error){
                reject(error);
            }
        })
    }
    });
    
}
 
module.exports = User;