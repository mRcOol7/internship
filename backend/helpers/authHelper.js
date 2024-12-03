const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { upload } = require('./multerConfig');
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
    console.log(req.body);
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

const uploadImage = async (req, res) => {
    console.log('Received image upload request');
    console.log(req.file);
    try {
        upload.single('image')(req, res, async (err) => {
            if (err) {
                console.error('Error uploading image:', err);
                return res.status(500).json({ message: 'Image upload failed', error: err });
            }
            
            if (!req.file) {
                return res.status(400).json({ message: 'No image file provided' });
            }

            const imageUrl = req.file.path;
            console.log('Image URL:', imageUrl);
            
            res.status(200).json({
                message: 'Image uploaded successfully',
                url: imageUrl,
            });
        });
    } catch (error) {
        console.error('Error in image upload:', error);
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
};

const saveContent = async (req, res) => {
    console.log(req.body);
    console.log(req.headers);
    const { content } = req.body;
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        const userId = decoded.id;

        console.log('User ID:', userId);
        console.log('Content:', content);

        
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        
        const sql = 'INSERT INTO editor_content (user_id, content) VALUES (?, ?)';
        await db.query(sql, [userId, content]);
        res.status(201).json({ message: 'Content saved successfully' });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        
        res.status(500).json({ error: 'Error saving content' });
    }
};

const protectedRoute = ((req, res) => {
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
});


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
    login: login,
    signup: signup,
    protectedRoute: protectedRoute,
    saveContent: saveContent,
    saveImage: uploadImage,
    verifyToken: verifyToken
};