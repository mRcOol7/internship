const express = require('express');
const { signup, login, saveContent, saveImage: uploadImage } = require('../helpers/authHelper');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/save-content', saveContent);
router.post('/save-image', uploadImage);
module.exports = router;