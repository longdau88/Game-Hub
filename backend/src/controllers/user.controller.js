const userService = require('../services/user.service');
const prisma = require('../config/db');

class UserController {
  async getMe(req, res) {
    try {
      const profile = await userService.getProfile(req.user.userId);
      res.json(profile);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async updateMe(req, res) {
    try {
      const updatedUser = await userService.updateProfile(req.user.userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async changePassword(req, res) {
    try {
      await userService.changePassword(req.user.userId, req.body);
      res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async getFollowing(req, res) {
    try {
      const follows = await prisma.creatorFollow.findMany({
        where: { followerId: req.user.userId },
        include: { creator: { select: { id: true, username: true, avatarUrl: true, bio: true, _count: { select: { games: { where: { status: 'published' } } } } } } },
        orderBy: { createdAt: 'desc' }
      });
      res.json(follows.map(follow => ({ ...follow.creator, followedAt: follow.createdAt, publishedGamesCount: follow.creator._count.games })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch followed creators' });
    }
  }

  async getFollowStatus(req, res) {
    try {
      const creatorId = Number(req.params.id);
      const follow = await prisma.creatorFollow.findUnique({ where: { followerId_creatorId: { followerId: req.user.userId, creatorId } } });
      res.json({ following: Boolean(follow) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch follow status' });
    }
  }

  async toggleFollow(req, res) {
    try {
      const followerId = req.user.userId;
      const creatorId = Number(req.params.id);
      if (!Number.isInteger(creatorId) || creatorId === followerId) return res.status(400).json({ error: 'You cannot follow this creator' });
      const creator = await prisma.user.findUnique({ where: { id: creatorId }, select: { id: true } });
      if (!creator) return res.status(404).json({ error: 'Creator not found' });
      const existing = await prisma.creatorFollow.findUnique({ where: { followerId_creatorId: { followerId, creatorId } } });
      if (existing) {
        await prisma.creatorFollow.delete({ where: { followerId_creatorId: { followerId, creatorId } } });
        return res.json({ following: false });
      }
      await prisma.creatorFollow.create({ data: { followerId, creatorId } });
      res.status(201).json({ following: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update follow status' });
    }
  }
}

module.exports = new UserController();
