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

const logout = (req, res) => {
    res.status(200).json({ 
        success: true,
        message: 'Logout successful.' 
    });
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

const saveInvoice = async (req, res) => {
    console.log(req.body);
    console.log(req.userId);
    try {
        const { type, invoiceNumber, date, customerInfo, items, subtotal, tax, discount, total } = req.body;
        console.log(type, invoiceNumber, date, customerInfo, items, subtotal, tax, discount, total);
        
        if (!type || !invoiceNumber || !date || !customerInfo || !items || subtotal === undefined || tax === undefined || discount === undefined || total === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required invoice details.'
            });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        console.log(date);
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Please use YYYY-MM-DD format.'
            });
        }

        const { businessName, gst, pan, email } = customerInfo;

        let query_sql, query_params;
        if (type === 'wholesaler') {
            query_sql = `INSERT INTO ${type}s (
                user_id, invoice_number, date, customer_info, items, 
                subtotal, tax, discount, total, 
                business_name, gst_number, pan_number, email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            query_params = [
                req.userId, invoiceNumber, date, JSON.stringify(customerInfo), JSON.stringify(items),
                Number(subtotal) || 0, Number(tax) || 0, Number(discount) || 0, Number(total) || 0,
                businessName || null, gst || null, pan || null, email || null
            ];
        } else {
            query_sql = `INSERT INTO ${type}s (
                user_id, invoice_number, date, customer_info, items,
                subtotal, tax, discount, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            query_params = [
                req.userId, invoiceNumber, date, JSON.stringify(customerInfo), JSON.stringify(items),
                Number(subtotal) || 0, Number(tax) || 0, Number(discount) || 0, Number(total) || 0
            ];
        }
        
        const result = await query(query_sql, query_params);

        res.status(201).json({
            success: true,
            message: 'Invoice saved successfully',
            invoiceId: result.insertId
        });

    } catch (error) {
        console.error('Save Invoice Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getInvoice = async (req, res) => {
    try {
        const { type, invoiceNumber } = req.params;
        
        if (!type || !invoiceNumber) {
            return res.status(400).json({
                success: false,
                message: 'Invoice type and number are required.'
            });
        }

        const table = type === 'customer' ? 'customers' : 'wholesalers';
        
        const invoices = await query(
            `SELECT * FROM ${table} WHERE user_id = ? AND invoice_number = ?`,
            [req.userId, invoiceNumber]
        );

        if (invoices.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found.'
            });
        }

        const invoice = invoices[0];
        invoice.customer_info = JSON.parse(invoice.customer_info);
        invoice.items = JSON.parse(invoice.items);

        res.status(200).json({
            success: true,
            invoice
        });

    } catch (error) {
        console.error('Get Invoice Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    logout,
    uploadImage,
    saveContent,
    saveInvoice,
    getInvoice,
    verifyToken
};
