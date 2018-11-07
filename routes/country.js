'use strict'

var express = require('express');
var router = express.Router();
var countryDao = require('../models/countryDao');
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
var md_upload = multipart({ uploadDir: uploads_dir+'/countries',maxFilesSize:300000 });



/* Devuelve una lista con todos los paises
Se requiere ser administrador*/
router.get('/',[auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {
    countryDao.findAll().then((data) => {
            var result= [];
            for (var i = 0, len = data.length; i < len; i++) {

                let country={
                    id:data[i].id,
                    name:data[i].name,
                    image:data[i].image,
                    status:data[i].status,
                    userId: data[i].user_id,
                    createdAt:data[i].createdAt
                }  
                result.push(country);
            }

            return  res.rest.success(result);
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});

 
//Devuelve una lista de paises en funcion de una clave recibida.
router.get('/advancedSearch/:key', (req, res, next) => {
    
        var search = JSON.parse(req.params.key);
        
        let statement=" WHERE "+sqlGenerator.sqlGenerator(search);

        countryDao.findBy( statement ).then(( data) => {
                var result= [];
                for (var i = 0, len = data.length; i < len; i++) {
    
                    let country={
                        id:data[i].id,
                        name:data[i].name,
                        image:data[i].image,
                        status:data[i].status,
                        userId: data[i].user_id,
                        createdAt:  data[i].createdAt
                    }
                    
                    result.push(country);
                }
    
                return res.rest.success(result);
            
        }).catch(error=>{
            return res.rest.serverError("Ha ocurrido un error.");
            }
        )
    
    });




//devuelve un objeto pais con el id indicado
//***********falta crear el objeto pais={} ????????? */
router.get('/:id', (req, res, next) => {
    
    if (!req.params.id){
        return res.rest.serverError("Faltan datos obligatorios.");
    }
    var id = req.params.id;

    
    countryDao.findById( id).then((data) => {
            let country={};
            if(data.length){
                country={
                    id:data[0].id,
                    name:data[0].name,
                    image:data[0].image,
                    status:data[0].status,
                    userId: data[0].user_id,
                    createdAt:  data[0].createdAt
                }
            }
            return res.rest.success(country);
        
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});

//devuelve el archivo imagen de la carpeta de paises con el nombre recibido
router.get('/country-image/:imageFile', (req, res, next) => {
    
        var imageFile = req.params.imageFile;
        var path_file = uploads_dir+'/countries/'+imageFile;
    
        fs.stat(path_file,  (err) =>{
            if(err){
                return res.rest.badRequest('La imagen no existe.');
            }else{ 
                res.sendFile(path.resolve(path_file));
            }
        });
    
    });



//Guarda un pais
//debe ser administrador
//se recibe un objeto pais
//Si existe imagen se mueve a su carpeta definitiva
//se Guarda el pais en la bd
//se devuelve el id insertado
router.post('/',[auth.ensureAuth], (req, res, next) => {

    if (!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var country = {
        id: null,
        name: req.body.name.trim(),
        image: req.body.image,
        status: req.body.status,
        userId: req.user.sub,
        createdAt:  moment().format('YYYY-MM-DD HH:mm:ss')
    };

    if(req.user.role==5){
        country.status=1;
    }
    var err=null;

    //comprobamos si existe el pais

    countryDao.findByName(country.name).then((data) => {
        if (data.length == 0) {

            //si existe imagen la movemos a su ubicacion definitiva
            if (country.image!=""){
                if (fileExists(uploads_dir+"/temp/"+country.image)){

                    var extension = country.image.split('.');
                    extension = extension[1];

                    fs.renameSync(uploads_dir+"/temp/"+country.image, uploads_dir+"/countries/"+ country.name +"."+extension);
                    country.image=country.name +"."+extension;

                }else{
                     err='La imagen no existe.';
                }
            }


            if (err==null){

                countryDao.insert(country).then((data) => {
                        return  res.rest.success(data);
                }).catch(error=>{
                    return res.rest.badRequest("No se ha podido guardar el nuevo pais");
                    }
                )
            }else{
                return  res.rest.serverError(err);
            }
            


        }else{
            return res.rest.badRequest("El pais introducido ya existe");
        }

    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});



//Modifica un pais
//debe accederse como administrador
//devuelve las filas afectadas
router.put('/', [auth.ensureAuth, adminAuth.isAdmin] ,(req, res, next) => {
    
    if (!req.body.id||!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }
    var country = {
        id: req.body.id,
        name: req.body.name.trim(),
        image: req.body.image,
        status: req.body.status
    };
    
    

    countryDao.edit(country).then((data) => {
        
            if (data==1) return res.rest.success(data);
            else return res.rest.badRequest("No se ha modificado ningún país.");
        
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});



//mueve la imagen temporal de pais a su carpeta definitiva
//modifica pais en la bd, actualizando su imagen.
router.post('/country-image',[auth.ensureAuth, adminAuth.isAdmin], (req, res, next) => {

    if (! req.body.country.id||!req.body.country.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var pacountryis = {
        id: req.body.country.id,
        name: req.body.country.name.trim(),
        image: req.body.tempImage,
        status: req.body.country.status
    };
    var err=null;

    


    if (fileExists(uploads_dir+"/temp/"+country.image)){

        var extension = country.image.split('.');
        extension = extension[1];

        fs.renameSync(uploads_dir+"/temp/"+country.image, uploads_dir+"/countries/"+ country.name +"."+extension);
        country.image=country.name +"."+extension;
        countryDao.edit(country).then(( data) => {
                if (data==0) return res.rest.badRequest("No se ha modificado ningún pais.");
                else return res.rest.success(data);
            
        }).catch(error=>{
            return  res.rest.badRequest("No se ha podido guardar el nuevo pais");
            }
        )


    
    }else{
        err='La imagen no existe.';
        return res.rest.serverError(err);
    }


});

//BORRA LA IMAGEN DEL PAIS Y ACTUALIZA LA BD
router.put('/country-image', [auth.ensureAuth, adminAuth.isAdmin] ,(req, res, next) => {
    
    if (!req.body.id||!req.body.name){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    if(req.body.name.trim().length<2){
        return res.rest.badRequest("Nombre demasiado corto.");
    }

    var country = {
        id: req.body.id,
        name: req.body.name.trim(),
        image: req.body.image,
        status: req.body.status
    };
    
    

    if (fileExists(uploads_dir+"/countries/"+country.image)){
        
        var file_path=uploads_dir+'/countries/'+country.image;    
    
        fs.unlink(file_path, (err) => {
            if (err) {
                return res.rest.serverError('Se ha producido un error borrando la imagen.');
            } else {
                country.image="";
                countryDao.edit(country).then(( data) => {
                        if (data==1) return res.rest.success(data);
                        else return res.rest.badRequest("No se ha modificado ningún pais.");
                    
                }).catch(error=>{
                    return res.rest.serverError("Ha ocurrido un error.");
                    }
                )
            }
        });

    }else{
        return res.rest.badRequest("No se haencontrado la imagen.");
    }
});


//borra el pais del id indicado
//debe accederse con token de administrador
//devuelve las filas afectadas
router.delete('/:countryId',[auth.ensureAuth, adminAuth.isAdmin],(req, res, next)=>{
        
    if (!req.params.countryId){
        return res.rest.badRequest("Faltan datos obligatorios.");
    }
    var id=req.params.countryId;

    
    countryDao.delete(id).then((data) => {
            if (data==0) return res.rest.badRequest("No se ha borrado ningún pais.");
            else return res.rest.success(data);
        
    }).catch(error=>{
        return res.rest.serverError("Ha ocurrido un error.");
        }
    )
});






function fileExists(path) {
    try {
        return fs.statSync(path).isFile();
    } catch (e) {
        return false;
    }
}



module.exports = router;