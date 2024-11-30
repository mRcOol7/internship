const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../db');

const signup = async(req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async(req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            res.status(401).json({ message: 'User not found' });
        } else {
            const isPasswordValid = await bcrypt.compare(password, rows[0].password);
            if (isPasswordValid) {
                const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET);
                res.status(200).json({ token });
            } else {
                res.status(401).json({ message: 'Invalid password' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const protectedRoute = async(req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
    } else {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.status(401).json({ message: 'Unauthorized' });
            } else {
                res.status(200).json({ message: 'Protected route', userId: decoded.id });
            }
        });
    }
};

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports={
    login:login,
    signup:signup,
    protectedRoute:protectedRoute,
    verifyToken:verifyToken
};