const bcrypt = require('bcryptjs');

const pool = require('../config/db'); 

const createUser = async (email, hashedPassword, avatar, role) => {
    const [result] = await pool.execute(
        'INSERT INTO users (email, password, avatar, role) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, avatar, role]
    );
    return result;
};

const findByEmail = async (email) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

const validatePassword = async (user, password) => {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, user.password);
};

module.exports = {
    createUser,
    findByEmail,
    validatePassword
};

