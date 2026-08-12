const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const categoryController = require('../controllers/category.controller');
const { cacheMiddleware } = require('../middleware/cache.middleware');

const router = express.Router();

router.get('/', cacheMiddleware(3600), categoryController.getAllCategories); // Cache categories for 1 hour
router.post('/', requireAuth, requireAdmin, categoryController.createCategory);
router.put('/:id', requireAuth, requireAdmin, categoryController.updateCategory);
router.delete('/:id', requireAuth, requireAdmin, categoryController.deleteCategory);

module.exports = router;
