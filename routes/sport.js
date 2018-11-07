'use strict'

var express = require('express');
var router = express.Router();
var sportDao = require('../models/sportDao');
var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/is_admin');
var sqlGenerator=require('../config/sqlStatements');
var moment = require('moment');
//fs (file system) nos permite borrar archivos 
var fs = require('fs');
//path nos permite acceder a archivos
var path = require('path');
//multiparty nos permite subir archivos
var multipart = require('connect-multiparty');
//var uploads_dir="/root/apiRest/uploads";
var uploads_dir="./uploads/";
//variable para el middleware
var md_upload = multipart({ uploadDir: uploads_dir+'/sports', maxFilesSize: 300000 });



/* Devuelve una lsita con todos los deportes
Se requiere ser administrador*/
router.get('/',[auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {
    sportDao.findAll().then((data) => {
            var result= [];
            for (var i = 0, len = data.length; i < len; i++) {

                let sport={
                    id:data[i].id,
                    name:data[i].name,
                    image:data[i].image,
                    status:data[i].status,
                    userId: data[i].user_id,
                    createdAt: data[i].createdAt
                }
                result.push(sport);
            }
            return res.rest.success(result);
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
    });
})


//Devuelve una lista de deportes en funcion de una clave recibida.
router.get('/advancedSearch/:key', (req, res, next) => {
    
        var search = JSON.parse(req.params.key);
        let statement="";

        statement=" WHERE "+sqlGenerator.sqlGenerator(search);

        sportDao.findBy( statement).then((data) => {
                var result= [];
                for (var i = 0, len = data.length; i < len; i++) {
    
                    let sport={
                        id:data[i].id,
                        name:data[i].name,
                        image:data[i].image,
                        status:data[i].status,
                        userId: data[i].user_id,
                        createdAt: data[i].createdAt
                    };
                    
                    result.push(sport);
                }
                return res.rest.success(result);
        }).catch(error=>{
                return res.rest.serverError("Ha ocurrido un error.");
            });
    
    });







//devuelve un objeto deporte con el id indicado
router.get('/:id', (req, res, next) => {

    if (!req.params.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.id;

    sportDao.findById(id).then(( data) => {
            let sport={};
            if(data.length){
                sport={
                    id:data[0].id,
                    name:data[0].name,
                    image:data[0].image,
                    status:data[0].status,
                    userId: data[0].user_id,
                    createdAt:  data[0].createdAt
                };
                
            }
             return res.rest.success(sport); 
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
    });
})




//devuelve el archivo imagen con el nombre recibido
router.get('/sport-image/:imageFile', (req, res, next) => {

    var imageFile = req.params.imageFile;
    var path_file = uploads_dir+'/sports/' + imageFile;

    fs.stat(path_file, (err) => {
        if (err) {
            return res.rest.badRequest('La imagen no existe.');
        } else {
            res.sendFile(path.resolve(path_file));
        }
    });

});




//Guarda un deporte
//debe ser administrador
//se recibe un objeto deporte
//Si existe se mueve la imagen a su carpeta definitiva
//se Guarda el deporte en la bd
//se devuelve el id insertado
router.post('/', [auth.ensureAuth], (req, res, next) => {

    if (!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios1.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    let sport = {
        id: null,
        name: req.body.name.trim(),
        image: req.body.image,
        status: req.body.status,
        userId: req.user.sub,
        createdAt:  moment().format('YYYY-MM-DD HH:mm:ss')
    };

    if(req.user.role==5){
        sport.status=1;
    }
    var err = null;


    //comprobamos si existe el deporte
    sportDao.findByName(sport.name).then((data) => {
        if (data.length == 0) {
            //si existe imagen la movemos a su ubicacion definitiva
            if (sport.image != "") {
                if (fileExists(uploads_dir+"/temp/" + sport.image)) {

                    var extension = sport.image.split('.');
                    extension = extension[1];

                    fs.renameSync(uploads_dir+"/temp/" + sport.image, uploads_dir+"/sports/" + sport.name + "." + extension);
                    sport.image = sport.name + "." + extension;

                } else {
                    err = 'La imagen no existe.';
                }
            }

            if (err == null) {
                sportDao.insert(sport).then((data) => {
                        return res.rest.success(data);
                }).catch(error=>{
                    return res.rest.badRequest("No se ha podido guardar el nuevo deporte");
                });
            } else {
                return res.rest.serverError(err);
            }

        } else {
            return res.rest.badRequest("El deporte introducido ya existe");
        }
    }).catch(error=>{
        return res.rest.serverError(error);
    });
});


//mueve la imagen temporal de deporte a su carpeta definitiva
//modifica deporte en la bd, actualizando su imagen.
router.post('/sport-image', [auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {


    if (!req.body.sport.id||!req.body.sport.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    } 
    if(req.body.sport.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var sport = {
        id: req.body.sport.id,
        name: req.body.sport.name.trim(),
        image: req.body.tempImage,
        status: req.body.sport.status
    };
    var err = null;

    

    if (fileExists(uploads_dir+"/temp/" + sport.image)) {

        var extension = sport.image.split('.');
        extension = extension[1];

        fs.renameSync(uploads_dir+"/temp/" + sport.image, uploads_dir+"/sports/" + sport.name + "." + extension);
        sport.image = sport.name + "." + extension;
        sportDao.edit(sport).then((data) => {
                if (data == 0) return res.rest.badRequest("No se ha modificado ningún deporte.");
                else return res.rest.success(data);
        }).catch(error=>{
            return res.rest.badRequest("No se ha podido guardar el nuevo deporte");
        });


    } else {
        err = 'La imagen no existe.';
        return res.rest.serverError(err);
    }


});

//Modifica un deporte
//debe accederse como administrador
//devuelve las filas afectadas
router.put('/', [auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {

    if (!req.body.id||!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var sport = {
        id: req.body.id,
        name: req.body.name.trim(),
        image: req.body.image,
        status: req.body.status
    };

    

    sportDao.edit(sport).then((data) => {
        if (data == 1) return res.rest.success(data);
        else return res.rest.badRequest("No se ha modificado ningún deporte.");
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
    });
});

//BORRA LA IMAGEN DEL DEPORTE Y LO ACTUALIZA EN LA BD
//debe accederse como administrador
//devuelve las filas afectadas
router.put('/sport-image', [auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {

    if (!req.body.id||!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }


    var sport = {
        id: req.body.id,
        name: req.body.name.trim(),
        image: req.body.image,
        status: req.body.status
    };

    if (fileExists(uploads_dir+"/sports/" + sport.image)) {

        var file_path = uploads_dir+'/sports/' + sport.image;

        fs.unlink(file_path, (err) => {
            if (err) {
                return res.rest.serverError('Se ha producido un error borrando la imagen.');
            } else {
                sport.image= "";
                sportDao.edit(sport).then((data) => {
                        if (data == 1) return res.rest.success(data);
                        else return res.rest.badRequest("No se ha modificado ningún deporte.");
                }).catch(error=>{
                    return res.rest.serverError("Ha ocurrido un error.");
                });
            }
        });

    } else { 
        return res.rest.badRequest("No se haencontrado la imagen.");
    }




});


//borra el deporte del id indicado
//debe accederse con token de administrador
//devuelve las filas afectadas
router.delete('/:sportId', [auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {

    if (!req.params.sportId){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.sportId;


    sportDao.delete(id).then((data) => {
            if (data == 0) res.rest.badRequest("No se ha borrado ningún deporte.");
            else return res.rest.success(data);

    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
    });
});





function fileExists(path) {
    try {
        return fs.statSync(path).isFile();
    } catch (e) {
        return false;
    }
}



module.exports = router;