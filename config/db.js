const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gesdemdev',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

const testConnection = async () => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        console.log('Database connection successful:', rows[0].result === 2 ? 'Success' : 'Failed');
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
};

testConnection();

module.exports = pool;
