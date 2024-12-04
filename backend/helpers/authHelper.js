const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { upload } = require('./multerConfig');
const db = require('../db');

// Signup Controller
const signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        try {
            // Check if user already exists
            const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                return res.status(409).json({ message: 'Email already exists.' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
            
            res.status(201).json({ message: 'User created successfully' });
        } catch (dbError) {
            console.error('Database Error:', dbError);
            if (dbError.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Email already exists.' });
            }
            throw dbError; // Re-throw for the outer catch block
        }
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ 
            message: 'Internal Server Error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login Controller
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Test database connection first
        await db.query('SELECT 1');
        
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Login Error Details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(500).json({ message: 'Database connection failed. Please try again later.' });
        }
        
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error.' });
        }
        
        res.status(500).json({ 
            message: 'Internal Server Error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Image Upload Controller
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

// Save Content Controller
const saveContent = async (req, res) => {
    const { content } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    if (!content) {
        return res.status(400).json({ message: 'Content is required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        await db.query('INSERT INTO editor_content (user_id, content) VALUES (?, ?)', [userId, content]);
        res.status(201).json({ message: 'Content saved successfully.' });
    } catch (error) {
        console.error('Save Content Error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        res.status(500).json({ message: 'Internal Server Error.' });
    }
};

// Protected Route
const protectedRoute = (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ message: 'Protected route.', userId: decoded.id });
    } catch (error) {
        console.error('Protected Route Error:', error.message);
        res.status(401).json({ message: 'Unauthorized.' });
    }
};

// Token Verification Middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error('Token Verification Error:', error.message);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = {
    signup,
    login,
    uploadImage,
    saveContent,
    protectedRoute,
    verifyToken,
};
