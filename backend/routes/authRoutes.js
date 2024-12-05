const express = require('express');
const { signup, login, logout, saveContent, uploadImage, saveInvoice, getInvoice, verifyToken } = require('../helpers/authHelper');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', verifyToken, logout);

router.post('/save-content', verifyToken, saveContent);
router.post('/save-image', verifyToken, uploadImage);

router.post('/save-invoice', verifyToken, saveInvoice);
router.get('/get-invoice', verifyToken, getInvoice);

module.exports = router;