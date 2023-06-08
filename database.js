import mysql from 'mysql';

var conn = mysql.createConnection({
    host : 'mysql-bomabot.alwaysdata.net',
    database : 'bomabot_mysql',
    user : 'root',
    password : ''
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