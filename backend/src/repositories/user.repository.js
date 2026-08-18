const prisma = require('../config/db');

class UserRepository {
  async findByIdWithStats(id) {
    const [user, stats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatarUrl: true,
          bio: true,
          xp: true,
          level: true,
          loginStreak: true,
          createdAt: true,
          badges: {
            include: {
              badge: true
            }
          }
        }
      }),
      prisma.game.aggregate({
        where: { uploaderId: parseInt(id) },
        _count: true,
        _sum: { playCount: true }
      })
    ]);
    return { user, stats };
  }

  async findByUsernameExcludingId(username, id) {
    return prisma.user.findFirst({
      where: { 
        username,
        id: { not: parseInt(id) }
      }
    });
  }

  async findByIdWithPassword(id) {
    return prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        xp: true,
        level: true,
        loginStreak: true,
      }
    });
  }
}

module.exports = new UserRepository();
