const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT)
});

db.getConnection()
    .then((connection) => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch((error) => {
        console.error('Error connecting to database:', error);
    });

module.exports = db;