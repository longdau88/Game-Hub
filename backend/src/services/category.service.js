const categoryRepository = require('../repositories/category.repository');
const auditLogService = require('./audit.service');
const { clearCache } = require('../middleware/cache.middleware');

class CategoryService {
  async getAllCategories() {
    return categoryRepository.findAll();
  }

  async createCategory(adminId, { name, slug, nameTranslations }) {
    if (!name || !slug) {
      const error = new Error('Name and slug are required');
      error.statusCode = 400;
      throw error;
    }
    
    try {
      const category = await categoryRepository.create({ name, slug, nameTranslations });
      clearCache('/api/categories');

      await auditLogService.log(adminId, 'CREATE_CATEGORY', 'Category', {
        categoryId: category.id,
        name,
        slug
      });

      return category;
    } catch (error) {
      if (error.code === 'P2002') {
        const err = new Error('Category with this name or slug already exists');
        err.statusCode = 400;
        throw err;
      }
      throw error;
    }
  }

  async updateCategory(adminId, id, { name, slug, nameTranslations }) {
    const category = await categoryRepository.update(id, { name, slug, nameTranslations });
    clearCache('/api/categories');

    await auditLogService.log(adminId, 'UPDATE_CATEGORY', 'Category', {
      categoryId: id,
      name,
      slug
    });

    return category;
  }

  async deleteCategory(adminId, id) {
    const categoryWithGames = await categoryRepository.findByIdWithGamesCount(id);
    
    if (categoryWithGames && categoryWithGames._count.games > 0) {
      const error = new Error('Cannot delete category because it has associated games');
      error.statusCode = 400;
      throw error;
    }
    
    await categoryRepository.delete(id);
    clearCache('/api/categories');

    await auditLogService.log(adminId, 'DELETE_CATEGORY', 'Category', {
      categoryId: id,
      categoryName: categoryWithGames?.name
    });
  }
}

module.exports = new CategoryService();
