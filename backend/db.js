const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',       // your host
  user: 'root',            // your user
  password: 'root',            // your password
  database: 'askme_db'     // your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL Database');
});

db.on('error', (err) => {
  console.error('MySQL error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconnecting to the database...');
    db.connect();
  } else {
    console.error('Unknown MySQL error:', err);
  }
});

module.exports = db;
