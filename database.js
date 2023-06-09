import mysql from 'mysql';

var conn = mysql.createConnection({
    host : process.env.MYSQL_HOST,
    database : process.env.MYSQL_DATABASE,
    user : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASSWORD
})

conn.connect(function(error){
    if(error){
        throw error;
    } else {
        console.log('MySQL Database is connected successfully');
    }
});

export default conn;

//module.exports = conn;