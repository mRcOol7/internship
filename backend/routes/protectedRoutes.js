const express = require('express');
const router = express.Router();
const { verifyToken } = require('../helpers/authHelper');

router.post('/protected', verifyToken, async (req, res) => {
    try {
        res.status(200).json({ 
            message: 'Protected route accessed successfully', 
            userId: req.userId
        });
        console.log('Protected route accessed successfully');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;