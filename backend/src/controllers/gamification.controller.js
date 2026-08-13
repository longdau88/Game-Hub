const prisma = require('../config/db');
const auditLogService = require('../services/audit.service');

exports.submitScore = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { score, secretKey } = req.body;
    const userId = req.user.userId;

    if (score === undefined || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.secretKey !== secretKey) {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    const leaderboardEntry = await prisma.leaderboard.create({
      data: {
        gameId,
        userId,
        score: parseInt(score)
      }
    });

    res.status(201).json({ message: 'Score submitted successfully', leaderboardEntry });
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const topScores = await prisma.leaderboard.findMany({
      where: { gameId },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: { username: true, id: true, avatarUrl: true }
        }
      }
    });

    res.json(topScores);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

// Admin: Badges CRUD
exports.getAllBadges = async (req, res) => {
  try {
    const badges = await prisma.badge.findMany();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
};

exports.createBadge = async (req, res) => {
  try {
    const { name, nameTranslations, description, descriptionTranslations, iconUrl } = req.body;
    const badge = await prisma.badge.create({
      data: { name, nameTranslations, description, descriptionTranslations, iconUrl }
    });
    await auditLogService.log(req.user.userId, 'CREATE_BADGE', 'Badge', {
      badgeId: badge.id, name: badge.name
    });
    res.status(201).json(badge);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Badge name already exists' });
    res.status(500).json({ error: 'Failed to create badge' });
  }
};

exports.deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const badge = await prisma.badge.delete({ where: { id: parseInt(id) } });
    await auditLogService.log(req.user.userId, 'DELETE_BADGE', 'Badge', {
      badgeId: badge.id, name: badge.name
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete badge' });
  }
};

// Admin: Grant Badge
exports.grantBadge = async (req, res) => {
  try {
    const { userId, badgeId } = req.body;
    const userBadge = await prisma.userBadge.create({
      data: {
        userId: parseInt(userId),
        badgeId: parseInt(badgeId)
      }
    });
    await auditLogService.log(req.user.userId, 'GRANT_BADGE', 'UserBadge', {
      targetUserId: userBadge.userId, badgeId: userBadge.badgeId
    });
    res.status(201).json({ message: 'Badge granted', userBadge });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'User already has this badge' });
    res.status(500).json({ error: 'Failed to grant badge' });
  }
};
