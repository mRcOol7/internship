const express = require('express');
const { signup, login, saveContent } = require('../helpers/authHelper');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/save-content', saveContent);
module.exports = router;