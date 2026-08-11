const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

// Public endpoints
router.get('/leaderboard/:gameId', gamificationController.getLeaderboard);

// Authenticated endpoints (Players)
router.post('/score/:gameId', requireAuth, gamificationController.submitScore);

// Admin endpoints (Badges)
router.get('/admin/badges', requireAuth, requireAdmin, gamificationController.getAllBadges);
router.post('/admin/badges', requireAuth, requireAdmin, gamificationController.createBadge);
router.delete('/admin/badges/:id', requireAuth, requireAdmin, gamificationController.deleteBadge);
router.post('/admin/badges/grant', requireAuth, requireAdmin, gamificationController.grantBadge);

module.exports = router;
