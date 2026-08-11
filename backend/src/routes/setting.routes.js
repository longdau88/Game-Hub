const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { getSettings, updateSettings } = require('../controllers/setting.controller');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
