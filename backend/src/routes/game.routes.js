const express = require('express');
const multer = require('multer');
const { uploadGame, getPublishedGames, getPendingGames, approveGame, getGameDetails } = require('../controllers/game.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Multer config for temporary storage
const upload = multer({ dest: '/tmp/uploads/' }); // In production, consider memory storage or OS temp dir

// User routes
router.get('/', getPublishedGames);
router.get('/:id', getGameDetails);
router.post('/upload', requireAuth, upload.single('gameFile'), uploadGame);

// Admin routes
router.get('/admin/pending', requireAuth, requireAdmin, getPendingGames);
router.put('/admin/:id/approve', requireAuth, requireAdmin, approveGame);

module.exports = router;
