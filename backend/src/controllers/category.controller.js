const categoryService = require('../services/category.service');

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const categories = await categoryService.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch categories' });
    }
  }

  async createCategory(req, res) {
    try {
      const adminId = req.user?.userId;
      const category = await categoryService.createCategory(adminId, req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create category' });
    }
  }

  async updateCategory(req, res) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      const category = await categoryService.updateCategory(adminId, id, req.body);
      res.json(category);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update category' });
    }
  }

  async deleteCategory(req, res) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      await categoryService.deleteCategory(adminId, id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Failed to delete category' });
    }
  }
}

module.exports = new CategoryController();
