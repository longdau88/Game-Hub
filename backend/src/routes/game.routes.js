const express = require('express');
const multer = require('multer');
const gameController = require('../controllers/game.controller');
const { uploadGame, getPublishedGames, getGameDetails, getMyGames } = gameController;
const { requireAuth } = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');

const router = express.Router();

// Multer config for temporary storage
const upload = multer({ dest: '/tmp/uploads/' }); // In production, consider memory storage or OS temp dir

// Public game routes
router.get('/', cacheMiddleware(60), getPublishedGames);
router.get('/:id', cacheMiddleware(30), getGameDetails);
router.post('/:id/play', gameController.incrementPlayCount); // Called when iframe loads

// Protected routes
router.post('/upload', requireAuth, upload.single('gameFile'), uploadGame);
router.get('/creator/games', requireAuth, getMyGames);
router.get('/user/bookmarked', requireAuth, gameController.getBookmarkedGames);
router.post('/:id/bookmark', requireAuth, gameController.toggleBookmark);

module.exports = router;
