const express = require('express');
const multer = require('multer');
const gameController = require('../controllers/game.controller');
const { uploadGame, getPublishedGames, getGameDetails, getMyGames, logSession, logCrash } = gameController;
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

const router = express.Router();

const os = require('os');
const path = require('path');

// Multer config for temporary storage
const upload = multer({ dest: os.tmpdir() });

// Public game routes
router.get('/', cacheMiddleware(60), getPublishedGames);
router.get('/search', gameController.semanticSearch);
router.get('/featured', cacheMiddleware(60), gameController.getFeaturedGames);
router.get('/:id', cacheMiddleware(30), getGameDetails);
router.post('/:id/play', gameController.incrementPlayCount); // Called when iframe loads
router.post('/:id/session', optionalAuth, logSession);
router.post('/:id/crash', logCrash);

// Protected routes
router.post('/upload', requireAuth, upload.fields([{ name: 'gameFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), uploadGame);
router.get('/creator/games', requireAuth, getMyGames);
router.put('/:id', requireAuth, upload.fields([{ name: 'coverImage', maxCount: 1 }]), gameController.updateGame);
router.delete('/:id', requireAuth, gameController.deleteGame);
router.get('/user/bookmarked', requireAuth, gameController.getBookmarkedGames);
router.get('/user/history', requireAuth, gameController.getGameHistory);
router.post('/:id/bookmark', requireAuth, gameController.toggleBookmark);

module.exports = router;
