const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');

const router = express.Router();

router.get('/', getAllCategories);
router.post('/', requireAuth, requireAdmin, createCategory);
router.put('/:id', requireAuth, requireAdmin, updateCategory);
router.delete('/:id', requireAuth, requireAdmin, deleteCategory);

module.exports = router;
