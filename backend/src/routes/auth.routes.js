const express = require('express');
const { register, verifyEmail, login, getProfile, sendOtp } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { checkRegistrationEnabled } = require('../middleware/maintenance.middleware');

const router = express.Router();

router.post('/send-otp', checkRegistrationEnabled, sendOtp);
router.post('/register', checkRegistrationEnabled, register);
router.get('/verify', verifyEmail);
router.post('/login', login);
router.get('/me', requireAuth, getProfile);

module.exports = router;
