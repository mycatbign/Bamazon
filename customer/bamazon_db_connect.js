// require("dotenv").config();

var mysql = require('mysql');
 
// Set up the connection object
var connection = mysql.createConnection({
    host: "localhost" ,
    
    // your port; if not 3306
    port: 3306,
    
    // your username
    user: "root",
    
    // your password
    password: "yourkey",
    database: "bamazon_db"
    });
    
// Connect to the database (callback function)
connection.connect(function(err) {
    if (err) throw err;
    // console.log("connected!");
//     connection.end();
});

module.exports = connection;