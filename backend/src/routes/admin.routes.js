const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { getDashboardStats, getAllUsers, toggleBanUser, changeUserRole, rejectGame, deleteGame } = require('../controllers/admin.controller');
const { getPendingGames, getPublishedGames, approveGame } = require('../controllers/game.controller');

const router = express.Router();

// All routes here are protected by requireAuth and requireAdmin
router.use(requireAuth, requireAdmin);

// Analytics
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/role', changeUserRole);

// Games
router.get('/games/pending', getPendingGames);
router.get('/games/published', getPublishedGames);
router.put('/games/:id/approve', approveGame);
router.put('/games/:id/reject', rejectGame);
router.delete('/games/:id', deleteGame);

module.exports = router;
