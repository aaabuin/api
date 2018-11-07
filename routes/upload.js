'use strict'

var express = require('express');
var router = express.Router();
var auth = require('../middlewares/authenticated');
var adminAuth = require('../middlewares/is_admin');

//fs (file system) nos permite borrar archivos 
var fs = require('fs');
//path nos permite acceder a archivos
var path = require('path');
//multiparty nos permite subir archivos
var multipart = require('connect-multiparty');
//var uploads_dir="/root/apiRest/uploads";
var uploads_dir="./uploads/";
//variable para el middleware
var md_upload = multipart({ uploadDir: uploads_dir+'/temp'});

//var md_upload = multipart({ uploadDir: './uploads/temp' ,maxFilesSize:500000 });



router.post('/upload-image', [auth.ensureAuth, md_upload], (req, res, next) => {

    var file_name = 'No subido...';
    if (req.files) {
        var file_path = req.files.image.path;
        if (req.files.image.size < 1000000){
            
            var file_split = file_path.split('\\');
            var file_name = file_split[2];
            

            if (req.files.image.type == 'image/png' || req.files.image.type == 'image/jpg' || 
            req.files.image.type == 'image/jpeg' || req.files.image.type == 'image/gif') {
                res.rest.success({fileName:file_name,filePath:file_path});
            } else {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        res.rest.serverError('Se ha producido un error de formato.');
                    } else {
                        res.rest.badRequest('Formato de imagen inválido.');
                    }
                });
            }
        }
        else
        {
            fs.unlink(file_path, (err) => {
                if (err) {
                    res.rest.serverError('Se ha producido un error....');
                } else {
                    res.rest.badRequest('El tamaño de la imagen excede el límite permitido: 1MB.');
                }
            });
        }


    } else {
         res.rest.badRequest('No se ha subido ninguna imagen.');
    }


});


//borra la imagen de la carpeta temporal de archivos
router.put('/upload-image', (req, res, next) => {
    

    var file_path=uploads_dir+'/temp/'+req.body.fileName;    

    fs.unlink(file_path, (err) => {
        if (err) {
            res.rest.serverError('Se ha producido un error.');
        } else {
            res.rest.success('Imagen eliminada correctamente.');
        }
    });
    
    
});

router.get('/upload-image/:imageFile', (req, res, next) => {
    
        var imageFile = req.params.imageFile;
        var path_file = uploads_dir+'/temp/'+imageFile;
    
        fs.stat(path_file,  (err) =>{
            if(err){
                res.rest.badRequest(path_file+'La imagen no existe:'+error);
            }else{ 
                res.sendFile(path.resolve(path_file));
            }
        });
    
    });




module.exports = router;