const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/send-code
router.post('/send-code', authController.sendCode);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

module.exports = router;
