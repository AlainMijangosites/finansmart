const mysql = require('mysql2');
require('dotenv').config();

console.log('DB DEBUG — MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT SET');
console.log('DB DEBUG — MYSQLHOST:', process.env.MYSQLHOST || 'NOT SET');
console.log('DB DEBUG — DB_HOST:', process.env.DB_HOST || 'NOT SET');

let pool;

if (process.env.MYSQL_URL) {
  pool = mysql.createPool(process.env.MYSQL_URL + '?enableKeepAlive=true');
} else {
  pool = mysql.createPool({
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASS     || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'finansmart_db',
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
