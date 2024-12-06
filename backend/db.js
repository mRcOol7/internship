const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sslCertPath = path.resolve(__dirname, 'isrgrootx1.pem');
let ssl = {};

try {
    ssl = {
        ca: fs.readFileSync(sslCertPath),
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    };
    console.log('SSL certificate loaded successfully');
} catch (error) {
    console.error('Error loading SSL certificate:', error);
    process.exit(1);
}

console.log('Database Configuration:', {
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    database: process.env.TIDB_DATABASE,
    hasPassword: !!process.env.TIDB_PASSWORD,
    hasSSL: !!ssl.ca
});

const config = {
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    timezone: '+05:30',
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(config);

pool.on('connection', (connection) => {
    console.log('New database connection established');
});

pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('Attempting to reconnect to database...');
        initializeDatabase().catch(error => {
            console.error('Failed to reconnect to database:', error);
        });
    }
});

const initializeDatabase = async () => {
    try {
        console.log('Verifying database connection...');
        await checkDatabaseHealth();
        console.log('Database verification completed successfully');

        // Create users table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                verification_token VARCHAR(255),
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table initialized successfully');

        console.log('Wholesalers table updated successfully');

    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};

initializeDatabase().catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});

async function query(sql, params = []) {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.execute(sql, params);
            return rows;
        } catch (error) {
            console.error(`Database Query Error (${retries} retries left):`, error);
            retries--;
            
            if (retries === 0) {
                throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

async function checkDatabaseHealth() {
    try {
        await query('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

async function getAllUsers() {
    try {
        const users = await query(
            'SELECT id, email, created_at FROM users ORDER BY created_at DESC'
        );
        console.log('\nUsers in database:');
        console.table(users);
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}
async function getAllCostomers(){
    try {
        const costomers=await query(
            'SELECT user_id, invoice_number, date, customer_info, items,subtotal, tax, discount, total created_at FROM customers ORDER BY created_at DESC'
        );
        console.log('\nCostomers in database:');
        console.table(costomers);
        return costomers;
    } catch (error) {
        console.error('Error fetching costumers:', error);
        throw error;
    }
} 

async function getAllWholesalers(){
    try {
        const wholesalers=await query(
            'SELECT invoice_number, date, customer_info, items, subtotal, tax, discount, total, business_name, gst_number, pan_number, email created_at FROM wholesalers ORDER BY created_at DESC'
        );
        console.log('\nWholesalers in database:');
        console.table(wholesalers);
        return wholesalers;
    } catch (error) {
        console.error('Error fetching wholesalers:', error);
        throw error;
    }
}

async function getUserByEmail(email) {
    try {
        const users = await query(
            'SELECT id, email, created_at FROM users WHERE email = ?',
            [email]
        );
        if (users.length > 0) {
            console.log('\nUser found:');
            console.table(users[0]);
            return users[0];
        }
        console.log('No user found with email:', email);
        return null;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}

async function getAllContent() {
    try {
        const content = await query(`
            SELECT 
                editor_content.id,
                editor_content.content,
                editor_content.created_at,
                users.email as user_email
            FROM editor_content
            JOIN users ON editor_content.user_id = users.id
            ORDER BY editor_content.created_at DESC
        `);
        console.log('\nEditor content in database:');
        console.table(content);
        return content;
    } catch (error) {
        console.error('Error fetching content:', error);
        throw error;
    }
}

async function getContentByUserEmail(email) {
    try {
        const content = await query(`
            SELECT 
                editor_content.id,
                editor_content.content,
                editor_content.created_at,
                users.email as user_email
            FROM editor_content
            JOIN users ON editor_content.user_id = users.id
            WHERE users.email = ?
            ORDER BY editor_content.created_at DESC
        `, [email]);
        console.log('\nContent for user:', email);
        console.table(content);
        return content;
    } catch (error) {
        console.error('Error fetching user content:', error);
        throw error;
    }
}


async function getDatabaseStats() {
    try {
        const [userCount] = await query('SELECT COUNT(*) as count FROM users');
        const [contentCount] = await query('SELECT COUNT(*) as count FROM editor_content');
        const [latestUser] = await query(
            'SELECT email, created_at FROM users ORDER BY created_at DESC LIMIT 1'
        );
        const [latestContent] = await query(
            'SELECT created_at FROM editor_content ORDER BY created_at DESC LIMIT 1'
        );

        console.log('\nDatabase Statistics:');
        console.log('Total Users:', userCount.count);
        console.log('Total Content Items:', contentCount.count);
        if (latestUser) {
            console.log('Latest User:', latestUser.email, 'created at', latestUser.created_at);
        }
        if (latestContent) {
            console.log('Latest Content created at:', latestContent.created_at);
        }

        return {
            userCount: userCount.count,
            contentCount: contentCount.count,
            latestUser,
            latestContent
        };
    } catch (error) {
        console.error('Error fetching database stats:', error);
        throw error;
    }
}

module.exports = {
    query,
    pool,
    checkDatabaseHealth,
    getAllUsers,
    getUserByEmail,
    getAllContent,
    getAllCostomers,
    getAllWholesalers,
    getContentByUserEmail,
    getDatabaseStats,
    initializeDatabase
};