const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { createReport, getAllReports, resolveReport } = require('../controllers/report.controller');

const router = express.Router();

router.post('/', requireAuth, createReport);
router.get('/admin', requireAuth, requireAdmin, getAllReports);
router.put('/admin/:id/resolve', requireAuth, requireAdmin, resolveReport);

module.exports = router;
