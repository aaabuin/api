'use strict'

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database: 'proyecto_tipster'
});


module.exports = connection;