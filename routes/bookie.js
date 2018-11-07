'use strict'

var express = require('express');
var router = express.Router();
var bookieDao = require('../models/bookieDao');
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
var md_upload = multipart({ uploadDir: uploads_dir+'/bookies',maxFilesSize:300000 });


router.get('/',[auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {
    bookieDao.findAll().then((data) => {
            var result= [];
            for (var i = 0, len = data.length; i < len; i++) {

                let bookie={
                    id:data[i].id,
                    name:data[i].name,
                    image:data[i].image,
                    status:data[i].status,
                    userId: data[i].user_id,
                    createdAt: data[i].createdAt
                }

                
                result.push(bookie);
            }

            return res.rest.success(result);
        
    }).catch(error=>{
         res.rest.serverError("Ha ocurrido un error.");
    });
});



router.get('/advancedSearch/:key', (req, res, next) => {

    var search = JSON.parse(req.params.key);
    let statement="";

    
    statement=" WHERE "+sqlGenerator.sqlGenerator(search);


    bookieDao.findBy( statement ).then((data) =>{
           var result= [];
            for (var i = 0, len = data.length; i < len; i++) {

                let bookie={
                    id:data[i].id,
                    name:data[i].name,
                    image:data[i].image,
                    status:data[i].status,
                    userId: data[i].user_id,
                    createdAt: data[i].createdAt
                };
                result.push(bookie);
            }
            return res.rest.success(result); 
        
    }).catch(error=>{
        res.rest.badRequest("Ha ocurrido un error.");
    });
});


router.get('/:id', (req, res, next) => {
    
    if (!req.params.id){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.id;

    bookieDao.findById(id).then((data)=>{
            if(data.length>0){
                let bookie={
                    id:data[0].id,
                    name:data[0].name,
                    image:data[0].image,
                    status:data[0].status,
                    userId:data[0].user_id,
                    createdAt:data[0].createdAt
                };
                return res.rest.success(bookie);
            }else{
                return res.rest.badRequest("No se encuentra la bookie.");
            }
        }
    ).catch(error=>{
        return res.rest.badRequest("No se encuentra la bookie.");
    });



});

router.get('/bookie-image/:imageFile', (req, res, next) => {
    
        var imageFile = req.params.imageFile;
        var path_file = uploads_dir+'/bookies/'+imageFile;
        fs.stat(path_file,  (err) =>{
            if(err){
                res.rest.badRequest('La imagen no existe.');
            }else{ 
                res.sendFile(path.resolve(path_file));
            }
        });
    
    });



router.post('/',[auth.ensureAuth], (req, res, next) => {

    if (!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var bookie = {
        id: null,
        name:  req.body.name.trim(),
        image: req.body.image,
        status: req.body.status,
        userId: req.user.sub,
        createdAt:  moment().format('YYYY-MM-DD HH:mm:ss')
    };

    if(req.user.role==5){
        bookie.status=1;
    }
    var err = null;



    
    //comprobamos si existe la bookie
        bookieDao.findByName(bookie.name).then((data) => {
            if (data.length == 0) {
    
                //si existe imagen la movemos a su ubicacion definitiva
                if (bookie.image!=""){
                    if (fileExists(uploads_dir+"/temp/"+bookie.image)){
    
                        var extension = bookie.image.split('.');
                        extension = extension[1];
    
                        fs.renameSync(uploads_dir+"/temp/"+bookie.image, uploads_dir+"/bookies/"+ bookie.name +"."+extension);
                        bookie.image=bookie.name +"."+extension;
    
                    }else{
                        err='La imagen no existe.';
                    }
                }
    
    
                if (err==null){
                    bookieDao.insert(bookie).then((data) => {
                            return res.rest.success(data);
                        
                    }).catch(err=>{
                        return  res.rest.badRequest("No se ha podido guardar el nuevo bookie");
                    });
                }
            }else{
                return res.rest.badRequest("El bookie introducido ya existe");
            }
    
        }).catch(error=>{
            return res.rest.serverError(error);
        });
    
});
    

    
//edita una bookie, debe presentarse un token valido de administrador
//de producirse con exito, devuelve las filas afectadas.
router.put('/', [auth.ensureAuth, adminAuth.isAdmin] ,(req, res, next) => {
    
    if (!req.body.id||!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }


    var bookie = {
        id: req.body.id,
        name:req.body.name.trim(),
        image: req.body.image,
        status: req.body.status
    };


    bookieDao.edit(bookie).then((data) => {
        if (data==1)res.rest.success(data);
        else  return res.rest.badRequest("No se ha modificado ninguna bookie.");

    }).catch(error=>{
return res.rest.serverError("Ha ocurrido un error.");
    });
});


//mueve la imagen de la carpeta temporal a la definitiva 
// realiza el cambio de nombre en la base de datos con edit()
//si todo va bien devuelve las filas afectadas
router.post('/bookie-image',[auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {
    
    if (!req.body.sport.id||!req.body.sport.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    } 
    if(req.body.sport.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var bookie = {
        id: req.body.bookie.id,
        name: req.body.sport.name.trim(),
        image: req.body.tempImage,
        status: req.body.bookie.status
    };
    var err=null;

    
    if (fileExists(uploads_dir+"/temp/"+bookie.image)){

        var extension = bookie.image.split('.');
        extension = extension[1];

        fs.renameSync(uploads_dir+"/temp/"+bookie.image, uploads_dir+"/bookies/"+ bookie.name +"."+extension);
        bookie.image=bookie.name +"."+extension;
        bookieDao.edit(bookie).then((data) => {

                if (data==0)  return res.rest.badRequest("No se ha modificado ninguna bookie.");
                else  return res.rest.success(data);
            
        }).catch(error=>{
            return res.rest.badRequest("No se ha podido modificar la bookie");
        });
        }
        else{
            err='La imagen no existe.';
            return res.rest.serverError(err);
        }
    
    });

    //recibe una bookie
//borra la imagen de la casa de apuestas y actualiza la bd con edit
router.put('/bookie-image', [auth.ensureAuth, adminAuth.isAdmin] ,(req, res, next) => {

    
    if (!req.body.id||!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }


    var bookie = {
        id: req.body.id,
        name: req.body.name.trim(),
        image: req.body.image,
        status: req.body.status
    };
    

    if (fileExists(uploads_dir+"/bookies/"+bookie.image)){
        
        var file_path=uploads_dir+'/bookies/'+bookie.image;    
    
        fs.unlink(file_path, (err) => {
            if (err) {
                return res.rest.serverError('Se ha producido un error borrando la imagen.');
            } else {
                bookie.image="";
                bookieDao.edit(bookie).then((data) => {

                        if (data==1) return res.rest.success(data);
                        else  return res.rest.badRequest("No se ha modificado ningún bookie.");
                    
                }).catch(error=>{
                    return res.rest.serverError("Ha ocurrido un error.");
                });
            }
        });

    }else{
        return res.rest.badRequest("No se haencontrado la imagen.");
    }
});



//Elimina la bookie con el id recibido.
//Debe presentarse un token de administrador
//devuelve numero de filas afectadas
router.delete('/:bookieId',[auth.ensureAuth, adminAuth.isAdmin],(req, res, next)=>{
     
    if (!req.params.bookieId){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id = req.params.bookieId;
    
    bookieDao.delete(id).then((data) => {
            if (data==0)  return res.rest.badRequest("No se ha borrado ningún bookie.");
            else  return res.rest.success(data);
        
    }).catch(error=>{
        return  res.rest.serverError("Ha ocurrido un error.");
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