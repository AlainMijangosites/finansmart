const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
  port:     process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
  user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASS     || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'finansmart_db',
  waitForConnections: true,
  connectionLimit: 10
});

const db = pool.promise();
pool.getConnection((err, conn) => {
  if (err) console.error('❌ MySQL:', err.message);
  else { console.log('✅ MySQL conectado'); conn.release(); }
});
module.exports = db;
