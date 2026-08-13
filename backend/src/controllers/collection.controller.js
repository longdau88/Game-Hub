const prisma = require('../config/db');

exports.getCollections = async (req, res) => {
  try {
    const userId = req.user.userId;
    const collections = await prisma.libraryCollection.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(collections);
  } catch (error) {
    console.error('getCollections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const existing = await prisma.libraryCollection.findFirst({
      where: { userId, name }
    });
    if (existing) {
      return res.status(400).json({ error: 'Collection name already exists' });
    }

    const collection = await prisma.libraryCollection.create({
      data: { userId, name }
    });
    res.status(201).json(collection);
  } catch (error) {
    console.error('createCollection error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = await prisma.libraryCollection.findUnique({
      where: { id: parseInt(id) }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collection.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this collection' });
    }

    const updated = await prisma.libraryCollection.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    res.json(updated);
  } catch (error) {
    console.error('updateCollection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const collection = await prisma.libraryCollection.findUnique({
      where: { id: parseInt(id) }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collection.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this collection' });
    }

    // Delete collection. Related UserLibrary items will have collectionId set to null (due to onDelete: SetNull in schema)
    await prisma.libraryCollection.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('deleteCollection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};
