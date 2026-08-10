const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

// Profile routes
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);

module.exports = router;
