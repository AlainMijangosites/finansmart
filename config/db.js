const mysql = require('mysql2');
require('dotenv').config();

let pool;

if (process.env.MYSQL_URL) {
  pool = mysql.createPool(process.env.MYSQL_URL);
} else {
  pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASS     || '',
    database: process.env.DB_NAME     || 'finansmart_db',
    waitForConnections: true,
    connectionLimit: 10
  });
}

const db = pool.promise();
pool.getConnection((err, conn) => {
  if (err) console.error('❌ MySQL:', err.message);
  else { console.log('✅ MySQL conectado'); conn.release(); }
});
module.exports = db;
