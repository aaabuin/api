const nodemailer= require('nodemailer');
var moment = require('moment');
var fs = require('fs');
//const path = require('path');
//const ABSPATH = path.dirname(process.mainModule.filename); 
let Email={};




Email.transporter = nodemailer.createTransport(
    {
        host: 'vps491390.ovh.net',
        secure: true,
        auth:{
            user:'proyectotipster@vps491390.ovh.net',
            pass:'proyecto1234567.'
        },
        tls:{
            rejectUnauthorized: false
        }
    },
    {
        from: 'Proyecto Tipster Web',
        headers:{

        }
    }
);

Email.greet = (username, email) => {
    return new Promise( (resolve, reject) =>{
        let message = {
                from: 'Proyecto Tipster <proyectotipster@vps491390.ovh.net>',
                to: email,
                subject: 'Registro en Proyecto Tipster',
                html: 'Hola <b>'+username+'</b>, bienvenido/a a Proyecto Tipster.' 
            }

            Email.transporter.sendMail(message, (error,info) => {
                if (error){
                     reject(error);
                }
                Email.transporter.close();
                 resolve("Correo enviado correctamente");
            })
    });

    
}


Email.curriculum = (coment, valoracion) => {
    return new Promise( (resolve, reject) =>{
        let message = {
            from: 'Curriculum <proyectotipster@vps491390.ovh.net>',
            to: "muchoabuin@hotmail.com, amadoabuin@gmail.com",
            subject: 'Valoracion '+valoracion+' del curriculum',
            html: 'Alguien ha valorado el curriculum '+valoracion+' y ha dejado el siguiente comentario: '+coment
        }
    
        Email.transporter.sendMail(message, (error,info) => {
            if (error){
                reject(error);
            }
            Email.transporter.close();
            resolve("Correo enviado correctamente");
        })
    });

    
}

Email.restorePassword = (username,email, password) => {
    return new Promise( (resolve, reject) =>{
        let message = {
            from: 'Proyecto Tipster <proyectotipster@vps491390.ovh.net>',
            to: email,
            subject: 'Nueva contraseña de Proyecto Tipster',
            html: "Hola <b>"+username+"</b>, hemos recibido una petición de reestablecer la contraseña.<br />La nueva contraseña es: "+password 
        }
    
        Email.transporter.sendMail(message, (error,info) => {
            if (error){
                reject(error);
            }
            Email.transporter.close();
            resolve("Correo enviado correctamente");
        })
    });

    
}


Email.sendBet = (bet ) => {
//bet.user.email

/*
let body="<div style='padding:25px;font-size:18px;background-color:grey;color:white;'>PROYECTO TIPSTER</div>"+

"Hola "+bet.user.username+", tienes una nueva apuesta de "+bet.bet.user.username+"<br/>"+
    "<div style='width:80%;background-color:grey;'>Importe: "+bet.amount+"€ ( Stake: "+bet.bet.stake+")</div>"+
    "<div style='width:80%;background-color:silver;'>Cuota: @</div>";

bet.picks.forEach(function(pick) {
    body+="<div style='width:80%;background-color:yellow;'>Competicion: "+pick.event.competition.name+
    "("+pick.event.competition.sport.name+" - "+pick.event.competition.country.name+")</div>"+
    "<div style='width:80%;background-color:white;'>"+pick.pick+"</div>"+
    "<div style='width:80%;background-color:yellow;'>Cuota: @"+pick.odd+"</div>"+
    "<div style='width:80%;background-color:grey;'>Fecha: "+moment(pick.event.date).format('MM/DD/YYYY HH:mm');+"</div>";
}, this);

body+="<div style='width:80%;'>Bookie: "+bet.bookie.name+"</div>";
*/

return new Promise( (resolve, reject) =>{
    Email.transporter.verify(function(error, success) {
        if (error) {
             console.log(error);
        } else {
             console.log('Server is ready to take our messages');
        }
     });
    
        let body = fs.readFileSync('config/email-nicepick.html', 'utf-8');
        body=body.replace(/---Tipstername---/g,bet.bet.user.username);
        //let cona= new EmailTemplate('config/email-nicepick.html');
        // console.log("AA"+cona);
        bet.user.email="amadoabuin@gmail.com,chuachi4@gmail.com,muchoabuin@hotmail.com,test-xj9jz@mail-tester.com";
        let message = {
            from: 'Proyecto Tipster <proyectotipster@vps491390.ovh.net>',
            to: bet.user.email,
            subject: 'Apuesta 11 de '+bet.bet.user.username ,
            /*
            attachments: [{
                filename: 'nicepick-email.jpeg',
                filePath: ABSPATH + '/uploads/users/nicepick-email.jpeg',
                cid: 'nicepick-email'
            }]
            ,
            */
           text:"Nueva apuesta de Tipster",
            html: body
             
        }
    
        Email.transporter.sendMail(message, (error,info) => {
            if (error){
                reject(error);
            }
            Email.transporter.close();
            resolve("Apuesta enviada correctamente");
        })
});
}


module.exports= Email;