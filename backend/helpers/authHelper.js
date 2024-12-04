const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { upload } = require('./multerConfig');
const { query } = require('../db');

const signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required.' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format.' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters long.' 
            });
        }

        const existingUsers = await query(
            'SELECT id FROM users WHERE email = ?', 
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ 
                success: false,
                message: 'Email already exists.' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        const token = jwt.sign(
            { id: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required.' 
            });
        }

        const users = await query(
            'SELECT id, email, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password.' 
            });
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password.' 
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const uploadImage = (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Image Upload Error:', err);
            return res.status(500).json({ message: 'Image upload failed.', error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided.' });
        }

        const imageUrl = req.file.path;
        res.status(200).json({ message: 'Image uploaded successfully.', url: imageUrl });
    });
};

const saveContent = async (req, res) => {
    try {
        const { content } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided.' 
            });
        }

        if (!content) {
            return res.status(400).json({ 
                success: false,
                message: 'Content is required.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await query(
            'INSERT INTO editor_content (user_id, content) VALUES (?, ?)',
            [decoded.id, content]
        );

        res.status(201).json({
            success: true,
            message: 'Content saved successfully.'
        });

    } catch (error) {
        console.error('Save Content Error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expired.' 
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token.' 
            });
        }

        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const protectedRoute = (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ 
            success: true,
            message: 'Protected route.',
            userId: decoded.id 
        });
    } catch (error) {
        console.error('Protected Route Error:', error.message);
        res.status(401).json({ 
            success: false,
            message: 'Unauthorized.' 
        });
    }
};

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const users = await query(
            'SELECT id FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'User no longer exists.' 
            });
        }

        req.userId = decoded.id;
        next();

    } catch (error) {
        console.error('Token Verification Error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expired.' 
            });
        }

        res.status(401).json({ 
            success: false,
            message: 'Invalid token.' 
        });
    }
};

module.exports = {
    signup,
    login,
    uploadImage,
    saveContent,
    protectedRoute,
    verifyToken
};
