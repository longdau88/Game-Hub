const prisma = require('../config/db');
const { clearCache } = require('../middleware/cache.middleware');

// Helper to write audit log
const logAudit = async (adminId, action, entity, details = {}) => {
  try {
    if (!adminId) return;
    await prisma.auditLog.create({
      data: { adminId, action, entity, details }
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write log:', err.message);
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { name, slug, nameTranslations } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
    
    const category = await prisma.category.create({
      data: { name, slug, nameTranslations }
    });
    clearCache('/api/categories');

    await logAudit(adminId, 'CREATE_CATEGORY', 'Category', {
      categoryId: category.id,
      name,
      slug
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category with this name or slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { name, slug, nameTranslations } = req.body;
    
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, slug, nameTranslations }
    });
    clearCache('/api/categories');

    await logAudit(adminId, 'UPDATE_CATEGORY', 'Category', {
      categoryId: id,
      name,
      slug
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    
    const categoryWithGames = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { games: true } } }
    });
    
    if (categoryWithGames && categoryWithGames._count.games > 0) {
      return res.status(400).json({ error: 'Cannot delete category because it has associated games' });
    }
    
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    clearCache('/api/categories');

    await logAudit(adminId, 'DELETE_CATEGORY', 'Category', {
      categoryId: id,
      categoryName: categoryWithGames?.name
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
