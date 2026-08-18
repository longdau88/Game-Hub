const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { getDashboardStats, getAllUsers, toggleBanUser, changeUserRole, createUser, updateUser, rejectGame, deleteGame, toggleFeaturedGame, getStorageStats, garbageCollect } = require('../controllers/admin.controller');
const { getPendingGames, getPublishedGames, approveGame } = require('../controllers/game.controller');
const { 
  runGarbageCollection, 
  updateHiddenTags, syncVectorDB, 
  getAnalyticsOverview, getSessionStats, getCrashLogs,
  getEmailTemplates, createEmailTemplate, sendEmailCampaign, getEmailCampaigns,
  getGameVersions, rollbackGame 
} = require('../controllers/admin-advanced.controller');
const { cacheMiddleware } = require('../middleware/cache.middleware');

const router = express.Router();

// All routes here are protected by requireAuth and requireAdmin
router.use(requireAuth, requireAdmin);

// Analytics & System
router.get('/stats', cacheMiddleware(10), getDashboardStats);


// Users
router.get('/users', cacheMiddleware(10), getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/role', changeUserRole);

// Games
router.get('/games/pending', cacheMiddleware(10), getPendingGames);
router.get('/games/published', cacheMiddleware(10), getPublishedGames);
router.put('/games/:id/approve', approveGame);
router.put('/games/:id/reject', rejectGame);
router.put('/games/:id/feature', toggleFeaturedGame);
router.delete('/games/:id', deleteGame);
router.get('/games/:id/versions', cacheMiddleware(10), getGameVersions);
router.put('/games/:id/versions/:versionId/rollback', rollbackGame);

// Storage
router.get('/storage/stats', cacheMiddleware(30), getStorageStats);
router.post('/storage/gc', garbageCollect);
router.post('/storage/cleanup', garbageCollect); // alias for cleanup

// AI & Recommendations
router.post('/games/:id/tags', updateHiddenTags);
router.post('/ai/sync', syncVectorDB);

// Analytics
router.get('/analytics/overview', cacheMiddleware(10), getAnalyticsOverview);
router.get('/analytics/sessions', cacheMiddleware(10), getSessionStats);
router.get('/analytics/crashes', cacheMiddleware(10), getCrashLogs);

// Mail Campaigns
router.get('/mail/templates', getEmailTemplates);
router.post('/mail/templates', createEmailTemplate);
router.get('/mail/campaigns', getEmailCampaigns);
router.post('/mail/campaigns', sendEmailCampaign);
router.delete('/mail/campaigns', requireAdmin, requireAuth, (req, res, next) => {
  // We need to import the function here or above
  require('../controllers/admin-advanced.controller').deleteEmailCampaigns(req, res).catch(next);
});

// Audit Logs
router.get('/audit-logs', requireAdmin, requireAuth, (req, res, next) => {
  require('../controllers/admin.controller').getAuditLogs(req, res).catch(next);
});

module.exports = router;
