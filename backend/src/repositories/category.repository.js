const prisma = require('../config/db');

class CategoryRepository {
  async findAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findByIdWithGamesCount(id) {
    return prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { games: true } } }
    });
  }

  async create(data) {
    return prisma.category.create({ data });
  }

  async update(id, data) {
    return prisma.category.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async delete(id) {
    return prisma.category.delete({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = new CategoryRepository();
