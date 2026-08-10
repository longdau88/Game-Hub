const express = require('express');
const router = express.Router();
const socialController = require('../controllers/social.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public route to get comments
router.get('/comments/:gameId', socialController.getComments);

// Protected routes
router.use(requireAuth);
router.post('/rate/:gameId', socialController.rateGame);
router.get('/rate/:gameId', socialController.getUserRating);
router.post('/comment/:gameId', socialController.addComment);

module.exports = router;
