const mysql = require('mysql2/promise');
const { db } = require('./env');

const pool = mysql.createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection()
    .then((conn) => {
        console.log('✅ MySQL connecté avec succès');
        conn.release();
    })
    .catch((err) => console.error('❌ Erreur de connexion MySQL :', err.message));

module.exports = pool;
