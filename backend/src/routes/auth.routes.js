const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { checkRegistrationEnabled } = require('../middleware/maintenance.middleware');

const router = express.Router();

router.post('/send-otp', checkRegistrationEnabled, authController.sendOtp);
router.post('/register', checkRegistrationEnabled, authController.register);
router.get('/verify', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', requireAuth, authController.getProfile);

module.exports = router;
