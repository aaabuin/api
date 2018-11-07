'use strict'

var express = require('express');
var router = express.Router();
var userDao = require('../models/userDao');
var emailModule = require('../config/email');
var auth = require('../middlewares/authenticated');
var jwt = require('../jwt');

//fs (file system) nos permite borrar archivos 
var fs = require('fs');
//path nos permite acceder a archivos
var path = require('path');
//multiparty nos permite subir archivos
var multipart = require('connect-multiparty');
//var uploads_dir="/root/apiRest/uploads";
var uploads_dir="./uploads/";
//variable para el middleware
var md_upload = multipart({ uploadDir: uploads_dir+'/users' });




/* Carga el usuario indicado por el token.
 Sirve para editar los datos del usuario logueado */
// Carga la informacion del usuario contenido en el token
router.get('/', auth.ensureAuth, (req, res, next) => {
    let user={};

        userDao.findByUsername(req.user.username).then((data) => {
            if (data && data.length > 0) {
                user={
                    id:data[0].id,
                    username:data[0].username,
                    password:null,
                    email:data[0].email,
                    avatar:data[0].avatar,
                    description:data[0].description
                };
                return res.rest.success(user);
    
            } else {
                return res.rest.serverError('Error cargando el usuario.');
            }
        }
        
        ).catch(error=>{
            return res.rest.serverError('Error cargando el usuario.');
        });
       
    }

);

//comprueba que un nombre de usuario esté en uso o no,
//si el nombre está libre devuelve exito, en caso contrario error
router.get('/username/:username', (req, res, next) => {

    if(!req.params.username||req.params.username==""){
        return res.rest.serverError('Faltan datos obligatorios.');
    }
        userDao.findByUsername(req.params.username).then((data) => {

            if (data && data.length == 0) {
                return res.rest.success("Nombre de usuario disponible");
            }
            else {
                return res.rest.badRequest('El nombre de usuario no es válido.');
            }
        }).catch(error=>{
            return res.rest.serverError('Error cargando el usuario.');
        });
    });

    



//crea un usuario con los datos recibidos (username, password e email)
// Se comprueba si no existe ninguno con ese username ni email
//inserta en la bd el usuario 
//devuelve el id.
router.post('/', (req, res, next) => {

    if (!req.body.username || !req.body.email || !req.body.password){
        return res.rest.badRequest("Faltan campos obligatorios");
    }
    if( req.body.username.trim().length<3){
        return res.rest.badRequest("Nombre de usuario demasiado corto.");
    }
        
        var user = {
            id: null,
            username: req.body.username.trim(),
            email: req.body.email,
            password: req.body.password
        };

        userDao.findByUsername(user.username).then((data) => {
            if (data.length == 0) {

                userDao.findByEmail(user.email).then((data) => {
                    if (data.length == 0) {

                        userDao.insert(user).then((data) => {
                            user.id = data;
                            if (data) {
                                //podemos devolver el id insertado
                                //o bien con user devolver el objeto entero
                                emailModule.greet(user.username,user.email).then(( result)=>{
                                        return res.rest.success(data);
                                }).catch(
                                    error=>{
                                        return  res.rest.badRequest("No se ha podido enviar el email de bienvenida");
                                    }
                                )
                            } else {
                                return res.rest.serverError('Error guardando el usuario');
                            }
                        }).catch(error=>{
                            return res.rest.serverError('Error guardando el usuario');
                        });
                    }
                    else {
                        return res.rest.badRequest('El email introducido  ya está registrado.');
                    }
                }).catch(error=>{
                    return res.rest.serverError('Error buscando email');
                });

            } else {
                return res.rest.badRequest('El nombre de usuario introducido ya está en uso.');

            }
        }
        ).catch(error=>{
            return res.rest.serverError('Error buscando el usuario');
        }); 
    
    


});



//Modifica el usuario logueado
//descripcion puede ser vacio
//Al pasar por ensureAuth, recibimos los datos del usuario(token) verificados en req.user
//devuelve success/error
router.put('/', auth.ensureAuth, (req, res, next) => {
    var user = {
        id: req.user.sub,
        description: req.body.description
    };

    userDao.editUser(user).then((data) => {
        if (data) {
            //data contiene el numero de filas afectadas
            return res.rest.success("Cambios guardados correctamente.");
        } else {
            return res.rest.serverError('Error modificando datos.');

        }
    }).catch(error=>{
        return res.rest.serverError('Error modificando datos.');
    });

});

/*
    Recibe una contraseña y un usuario logueado
    Comprueba si la contraseña recibida coincide con la del usuario del token
    Actualiza en la bd la contraseña del usuario logueado
    Devuelve success/error
*/
router.put('/password', auth.ensureAuth, (req, res, next) => {

    if(!req.body.oldPass||!req.body.newPass){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }else{
        userDao.checkPassword(req.user.username, req.body.oldPass).then((data) => {
            if (data) {
                userDao.updatePassword(req.user.sub, req.body.newPass).then((data) => {
                    if (data == 0) {
                        //data contiene el numero de filas afectadas
                        return res.rest.badRequest('No se ha podido cambiar la contraseña.');
                    }
                    if (data == 1) {
                        return  res.rest.success("Cambios guardados correctamente.");
                    }
                }).catch(error=>{
                    return res.rest.serverError('Error cambiando contraseña.');
                });
            }
            else {
                return  res.rest.badRequest(error);
            }
        }).catch(error=>{
            return res.rest.serverError('Error comprobando contraseña.');
        });        
    }


});


//recibe username y password
//si los encuentra,
// devuelve un objeto identity
//identity.token contiene el token
router.get('/token/:username', (req, res, next) => {
    
    if(!req.params.username || !req.headers.password){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }else{

    //Comprueba que la password sea correcta,
    //devuelve el objeto identity con datos relativos al usuario
    //identity contiene el token jwt
        userDao.checkPassword(req.params.username,req.headers.password).then((data )=> {
                
                var identity={
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    avatar: data.avatar
                };
                identity.token = jwt.createToken(data);

                return res.rest.success({identity:identity})
        }).catch(error=>{
            return res.rest.badRequest(error);
        });
    }

    
});



/*recibe username o email
se busca el usuario con ese nombre de usuario o email
cambia la contraseña en la bd por una generada al azar en resetPassword()
se envia la info a modulo EMAIL
devuelve success/error
*/
router.post('/password', (req, res, next) => {

    let user= {};
    if (req.body.username){
        
         userDao.findByUsername(req.body.username).then(( data)=>{
            if (data && data.length>0){
                user={
                    id:data[0].id,
                    username:data[0].username,
                    email:data[0].email
                }

                resetPassword(user).then((result)=>{
                        return res.rest.success(result);
                }).catch(
                    error=>res.rest.badRequest(error)
                )
            }else{
                return res.rest.badRequest('No se ha encontrado el nombre de usuario.');
            }
            
            }).catch(error=>{
                return res.rest.badRequest(error);
            });
 
    }
    
    if(req.body.email){
         userDao.findByEmail(req.body.email).then((data)=>{
            if (data && data.length>0){
                user={
                    id:data[0].id,
                    username:data[0].username,
                    email:data[0].email
                }
                resetPassword(user).then((result)=>{
                        return res.rest.success(result);
                }).catch(error=>{
                    return res.rest.badRequest(error);
                })
            } 
            else{
                return res.rest.badRequest('No se ha encontrado el email.');
            }
        }).catch(error=>{
            return res.rest.badRequest(error);
        });
    }
});

/*
recibe un nombre de imagen
si existe devuelve la imagen
si no devuelve error
*/
router.get('/user-image/:imageFile', (req, res, next) => {
        var imageFile = req.params.imageFile;
        var path_file = uploads_dir+'/users/'+imageFile;
    
        fs.exists(path_file, function(exists){
            if(exists){
                res.sendFile(path.resolve(path_file));
            }else{
                return  res.rest.badRequest('La imagen no existe.');
            }
        });
    
    });


    /*subir imagen de usuario
    Se recibe un archivo, si es del formato y peso adecuados...
    se comrueba si el usuario tiene imagen guardada anteriormente
    actualizamos la imagen del usuario en la bd
    si existia imagen con anterioridad la borramos del servidor
    devolvemos ******   filename / error   *********
    */
router.post('/user-image', [auth.ensureAuth, md_upload], (req, res, next) => {

    //var userId = req.user.sub;
    var file_name = 'No subido...';

    if (req.files) {
        var file_path = req.files.image.path;
        if (req.files.image.size < 1000000){

            
            var oldImage="";

            var file_split = file_path.split('\\');
            var file_name = file_split[2];
            

            if (req.files.image.type == 'image/png' || req.files.image.type == 'image/jpg' || 
            req.files.image.type == 'image/jpeg' || req.files.image.type == 'image/gif') {
        
                //cargamos la imagen antigua si existe para borrarla
                userDao.findByUsername(req.user.username).then((data)=>{
                   if (data && data[0].avatar!=null){
                       oldImage= uploads_dir+"/users/"+data[0].avatar;
                   } 
                }).catch(error=>{
                    return res.rest.badRequest(error);
                });
    
                userDao.updateUserImage(req.user.sub, file_name).then((data) => {
                        if (data) {
                            if (oldImage!=""){
                                fs.unlink(oldImage, (err) => {
                                    if (err) {
                                        return res.rest.serverError('Se ha producido un error.');
                                    }else{
                                        return  res.rest.success(file_name);
                                    }
                                    
                                });
                            }else{
                                return  res.rest.success(file_name);
                            }
                        } else {
                            return  res.rest.badRequest('No se ha podido actualizar el avatar de usuario.'); 
                        }
                }).catch(error=>{
                    return res.rest.serverError('Error al subir el archivo.');
                });
    
            } else {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        return res.rest.serverError('Se ha producido un error de formato.');
                    } else {
                        return res.rest.badRequest('Formato de imagen inválido.');
                    }
                });
            }
        }
        else
        {
            fs.unlink(file_path, (err) => {
                if (err) {
                    return res.rest.serverError('Se ha producido un error de peso.');
                } else {
                    return res.rest.badRequest('El tamaño de la imagen excede el límite permitido.');
                }
            });
        }
    } else {
        return res.rest.badRequest('No se ha subido ninguna imagen.');
    }
});

/*
    RESUMEN:borra la imagen del usuario.
    Procedimiento:recibe un usuario logueado
    borra la imagen de la bd
    borra la imagen del servidor
    decuelce success/error
*/
router.delete('/user-image', auth.ensureAuth, (req, res, next) => {
    userDao.findByUsername(req.user.username).then((data) => {
        if (data.length == 1) {           
            var file_path=uploads_dir+'/users/'+data[0].avatar;    

            userDao.updateUserImage(req.user.sub, null).then((data) => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        return  res.rest.serverError('Se ha producido un error.');
                    } else {
                        return  res.rest.success('Imagen eliminada correctamente.');
                    }
                });
            }).catch(error=>{
                return res.rest.serverError("Error eliminando la imagen");
            });
        }else{
            return  res.rest.serverError("Error eliminando la imagen");
        }
    }).catch(error=>{
        return res.rest.serverError(error);
    });
});

/*/
    recibe un usuario logueado
    comprueba token en middle
    devuelve exito/error
*/
    router.get('/valid-token', auth.ensureAuth ,(req, res, next) => {
        return res.rest.success('Token correcto.');
        
    }
);


router.get('/curriculum/', (req, res, next) => {
    
    if(!req.headers.vote ){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }else{
        emailModule.curriculum(req.headers.coment,req.headers.vote).then((success)=>{
                if (error){
                    reject("No se ha podido enviar la opinion");
                }else{
                    resolve("Opinion enviada.");
                }
            }).catch(error=>reject(error))
    }

    
});


// Carga la informacion del usuario segun el id recibido
//devuelve objeto user
router.get('/:userId', (req, res, next) => {
    
    if(!req.params.userId||req.params.userId==""){
        return res.rest.serverError('Faltan datos obligatorios.');
    }
    let user={};
    
    userDao.findById(req.params.userId).then((data) => {
        
        if (data && data.length > 0) {
            //data contiene la informacion del usuario
            //data[0].password = null;
            user={
                id:data[0].id,
                username:data[0].username,
                password:null,
                email:data[0].email,
                avatar:data[0].avatar,
                description:data[0].description
            };
            return res.rest.success(user);

        } else {
            return res.rest.serverError('Error cargando el usuario.');
        }
    }).catch(error=>{
        return res.rest.serverError('Error cargando el usuario.');
    });
    
});


function resetPassword(user) {
    return new Promise( (resolve, reject) =>{
        var newPassword="";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        
        for (var i = 0; i < 8; i++){
        newPassword += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        if(!user.id){
            reject("Faltan datos obligatorios.");
        }
        userDao.updatePassword(user.id,newPassword).then((result) => {
            if (result == 0) {
                //result contiene el numero de filas afectadas
                reject('No se ha podido cambiar la contraseña.');
            }
            
            if (result == 1) {
                emailModule.restorePassword(user.username,user.email, newPassword).then((result)=>{
                        resolve("Contraseña enviada.");
                }).catch(error=>{
                    reject("No se ha podido enviar la nueva contraseña.");
                });
            }
            }).catch(error=>{
                reject('Error cambiando contraseña.');
            });
        })


}


module.exports = router;