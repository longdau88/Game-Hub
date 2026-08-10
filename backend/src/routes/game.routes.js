const express = require('express');
const multer = require('multer');
const { uploadGame, getPublishedGames, getGameDetails } = require('../controllers/game.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Multer config for temporary storage
const upload = multer({ dest: '/tmp/uploads/' }); // In production, consider memory storage or OS temp dir

// User routes
router.get('/', getPublishedGames);
router.get('/:id', getGameDetails);
router.post('/upload', requireAuth, upload.single('gameFile'), uploadGame);

module.exports = router;
