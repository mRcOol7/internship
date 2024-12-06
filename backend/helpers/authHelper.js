const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { upload } = require('./multerConfig');
const { query } = require('../db');
const sendEmail = require('../utils/sendEmail');

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

        const existingUser = await query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await query(
            'INSERT INTO users (email, password, is_verified) VALUES (?, ?, ?)',
            [email, hashedPassword, true]
        );

        const subject = 'Signup Successful';
        const htmlContent = `
            <h2>Signup Successful!</h2>
            <p>Thank you for registering with us. Your account has been successfully created.</p>
        `;
        
        try {
            await sendEmail(email, subject, null, htmlContent);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Registration successful! You can now login.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration.'
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

        const result = await query(
            'SELECT id, email, password, is_verified FROM users WHERE email = ?',
            [email]
        );

        console.log('Database query result:', JSON.stringify(result, null, 2));

        if (!result || result.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password.' 
            });
        }

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password.' 
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token
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

        if (invoices[0]?.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found.'
            });
        }

        const invoice = invoices[0][0];
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

        if (users[0]?.length === 0) {
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

// const verifyEmail = async (req, res) => {
//     try {
//         const { token } = req.query;

//         if (!token) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Verification token is required'
//             });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
//         const result = await query(
//             'UPDATE users SET is_verified = true, verification_token = null WHERE email = ? AND verification_token = ? RETURNING *',
//             [decoded.email, token]
//         );

//         if (result[0]?.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid or expired verification token'
//             });
//         }

//         const welcomeHtml = `
//             <h2>Signup Successful</h2>
//             <p>Your email has been successfully verified. You can now log in to your account.</p>
//         `;

//         await sendEmail(
//             decoded.email,
//             'Email Verified',
//             'Your email has been successfully verified.',
//             welcomeHtml
//         );

//         res.status(200).json({
//             success: true,
//             message: 'Email verified successfully'
//         });

//     } catch (error) {
//         console.error('Email verification error:', error);
//         if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid or expired verification token'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: 'An error occurred during email verification'
//         });
//     }
// };

module.exports = {
    signup,
    login,
    logout,
    saveContent,
    uploadImage,
    saveInvoice,
    getInvoice,
    verifyToken,
    // verifyEmail
};
