const prisma = require('../config/db');
const { clearCache } = require('../middleware/cache.middleware');

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
    const { name, slug, nameTranslations } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
    
    const category = await prisma.category.create({
      data: { name, slug, nameTranslations }
    });
    clearCache('/api/categories');
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
    const { id } = req.params;
    const { name, slug, nameTranslations } = req.body;
    
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, slug, nameTranslations }
    });
    clearCache('/api/categories');
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is used
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
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
