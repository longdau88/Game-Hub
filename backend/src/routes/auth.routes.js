const express = require('express');
const { register, verifyEmail, login, getProfile, sendOtp } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.get('/verify', verifyEmail);
router.post('/login', login);
router.get('/me', requireAuth, getProfile);

module.exports = router;
