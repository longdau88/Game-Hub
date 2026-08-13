const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

// Public or optional auth routes
router.get('/:id/profile', optionalAuth, userController.getPublicProfile);

// All routes below require authentication
router.use(requireAuth);

// Profile routes
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.put('/me/password', userController.changePassword);
router.get('/following', userController.getFollowing);
router.get('/:id/follow-status', userController.getFollowStatus);
router.post('/:id/follow', userController.toggleFollow);

module.exports = router;
