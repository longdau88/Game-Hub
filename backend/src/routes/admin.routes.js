const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { getDashboardStats, getAllUsers, toggleBanUser, changeUserRole, rejectGame, deleteGame, toggleFeaturedGame, getStorageStats, garbageCollect } = require('../controllers/admin.controller');
const { getPendingGames, getPublishedGames, approveGame } = require('../controllers/game.controller');
const { 
  runGarbageCollection, 
  updateHiddenTags, syncVectorDB, 
  getSessionStats, getCrashLogs, 
  getEmailTemplates, createEmailTemplate, sendEmailCampaign, getEmailCampaigns,
  getGameVersions, rollbackGame 
} = require('../controllers/admin-advanced.controller');

const router = express.Router();

// All routes here are protected by requireAuth and requireAdmin
router.use(requireAuth, requireAdmin);

// Analytics & System
router.get('/stats', getDashboardStats);
router.get('/storage', getStorageStats);
router.post('/gc', garbageCollect);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/role', changeUserRole);

// Games
router.get('/games/pending', getPendingGames);
router.get('/games/published', getPublishedGames);
router.put('/games/:id/approve', approveGame);
router.put('/games/:id/reject', rejectGame);
router.put('/games/:id/feature', toggleFeaturedGame);
router.delete('/games/:id', deleteGame);
router.get('/games/:id/versions', getGameVersions);
router.put('/games/:id/versions/:versionId/rollback', rollbackGame);

// Storage
router.get('/storage/stats', getStorageStats);
router.post('/storage/gc', runGarbageCollection);

// AI & Recommendations
router.post('/games/:id/tags', updateHiddenTags);
router.post('/ai/sync', syncVectorDB);

// Analytics
router.get('/analytics/sessions', getSessionStats);
router.get('/analytics/crashes', getCrashLogs);

// Mail Campaigns
router.get('/mail/templates', getEmailTemplates);
router.post('/mail/templates', createEmailTemplate);
router.get('/mail/campaigns', getEmailCampaigns);
router.post('/mail/campaigns', sendEmailCampaign);

module.exports = router;
