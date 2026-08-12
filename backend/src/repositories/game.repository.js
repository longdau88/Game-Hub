const prisma = require('../config/db');

class GameRepository {
  async findPublishedGames(skip, take, categoryId, search) {
    const where = { status: 'published' };
    if (categoryId) {
      where.categories = { some: { categoryId: parseInt(categoryId) } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleTranslations: { string_contains: search } } // Simple JSON search workaround
      ];
    }
    
    return prisma.$transaction([
      prisma.game.count({ where }),
      prisma.game.findMany({
        where,
        include: {
          uploader: { select: { username: true, avatarUrl: true } },
          categories: { include: { category: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);
  }

  async findFeaturedGames(take) {
    return prisma.game.findMany({
      where: { status: 'published', isFeatured: true },
      include: {
        uploader: { select: { username: true, avatarUrl: true } },
        categories: { include: { category: true } }
      },
      orderBy: { createdAt: 'desc' },
      take
    });
  }

  async findById(id) {
    return prisma.game.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, username: true, avatarUrl: true } },
        categories: { include: { category: true } }
      }
    });
  }

  async create(data) {
    return prisma.game.create({ data });
  }

  async update(id, data) {
    return prisma.game.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.game.delete({ where: { id } });
  }

  async getMyGames(userId) {
    return prisma.game.findMany({
      where: { uploaderId: userId },
      include: {
        categories: { include: { category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async incrementPlayCount(id) {
    return prisma.game.update({
      where: { id },
      data: { playCount: { increment: 1 } }
    });
  }

  // Bookmarks
  async findBookmark(userId, gameId) {
    return prisma.bookmark.findUnique({
      where: { userId_gameId: { userId, gameId } }
    });
  }

  async createBookmark(userId, gameId) {
    return prisma.bookmark.create({
      data: { userId, gameId }
    });
  }

  async deleteBookmark(userId, gameId) {
    return prisma.bookmark.delete({
      where: { userId_gameId: { userId, gameId } }
    });
  }

  async getBookmarkedGames(userId) {
    return prisma.bookmark.findMany({
      where: { userId },
      include: {
        game: {
          include: {
            uploader: { select: { username: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // History & Metrics
  async logSession(data) {
    return prisma.playSession.create({ data });
  }

  async logCrash(data) {
    return prisma.crashReport.create({ data });
  }

  async getHistory(userId) {
    return prisma.playSession.findMany({
      where: { userId },
      include: {
        game: {
          include: { uploader: { select: { username: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }
}

module.exports = new GameRepository();
