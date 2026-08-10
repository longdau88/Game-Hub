const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const cacheMiddleware = require('../middleware/cache.middleware');

const router = express.Router();

router.get('/', cacheMiddleware(3600), getAllCategories); // Cache categories for 1 hour
router.post('/', requireAuth, requireAdmin, createCategory);
router.put('/:id', requireAuth, requireAdmin, updateCategory);
router.delete('/:id', requireAuth, requireAdmin, deleteCategory);

module.exports = router;
