const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const createUser = async (req, res) => {
    const { email, password, avatar, role } = req.body;
    console.log('Received data:', { email, password, avatar, role }); 
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) return res.status(400).json({ msg: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await User.createUser(email, hashedPassword, avatar, role);

        res.status(201).json({ msg: 'User created', id: result.insertId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        const isMatch = await User.validatePassword(user, password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token, role: user.role, userId: user.id }); 
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};


module.exports = {
    login, createUser
};
