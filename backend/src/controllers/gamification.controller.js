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
    const filter = req.query.filter; // 'friends'

    let whereClause = { gameId };

    if (filter === 'friends' && req.user) {
      const userId = req.user.userId;
      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ userId }, { friendId: userId }]
        }
      });
      
      const friendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);
      friendIds.push(userId); // Include self

      whereClause.userId = { in: friendIds };
    }

    const topScores = await prisma.leaderboard.findMany({
      where: whereClause,
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

// Daily Quests
const ensureDefaultQuests = async () => {
  const count = await prisma.dailyQuest.count();
  if (count === 0) {
    await prisma.dailyQuest.createMany({
      data: [
        { title: 'Play a Game', targetType: 'play_game', targetValue: 1, rewardXp: 50 },
        { title: 'Rate a Game', targetType: 'rate_game', targetValue: 1, rewardXp: 30 },
        { title: 'Daily Login', targetType: 'login', targetValue: 1, rewardXp: 20 }
      ]
    });
  }
};

exports.getDailyQuests = async (req, res) => {
  try {
    await ensureDefaultQuests();
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const quests = await prisma.dailyQuest.findMany();
    
    // Get or create progress
    const progressList = await Promise.all(quests.map(async (q) => {
      let prog = await prisma.userQuestProgress.findUnique({
        where: { userId_questId_date: { userId, questId: q.id, date: today } }
      });
      if (!prog) {
        // Automatically complete the 'login' quest since they are fetching quests
        let initialVal = 0;
        let isCompleted = false;
        if (q.targetType === 'login') {
          initialVal = 1;
          isCompleted = true; // Wait, they have to claim it.
        }
        prog = await prisma.userQuestProgress.create({
          data: { userId, questId: q.id, date: today, currentVal: initialVal }
        });
      } else if (q.targetType === 'login' && prog.currentVal < q.targetValue) {
         // Failsafe: if login wasn't recorded
         prog = await prisma.userQuestProgress.update({
           where: { userId_questId_date: { userId, questId: q.id, date: today } },
           data: { currentVal: 1 }
         });
      }
      return { ...q, progress: prog };
    }));

    res.json(progressList);
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

exports.claimQuestReward = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { questId } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const quest = await prisma.dailyQuest.findUnique({ where: { id: parseInt(questId) } });
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    const progress = await prisma.userQuestProgress.findUnique({
      where: { userId_questId_date: { userId, questId: quest.id, date: today } }
    });

    if (!progress) return res.status(400).json({ error: 'No progress found for today' });
    if (progress.isCompleted) return res.status(400).json({ error: 'Reward already claimed' });
    if (progress.currentVal < quest.targetValue) return res.status(400).json({ error: 'Quest not completed yet' });

    // Mark as completed
    await prisma.userQuestProgress.update({
      where: { userId_questId_date: { userId, questId: quest.id, date: today } },
      data: { isCompleted: true }
    });

    // Reward XP
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const newXp = (user.xp || 0) + quest.rewardXp;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel }
    });

    res.json({ message: 'Reward claimed', xp: newXp, level: newLevel, reward: quest.rewardXp });
  } catch (error) {
    console.error('Claim reward error:', error);
    res.status(500).json({ error: 'Failed to claim reward' });
  }
};

// Internal utility to advance quest progress
exports.advanceQuest = async (userId, targetType, amount = 1) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const quest = await prisma.dailyQuest.findFirst({ where: { targetType } });
    if (!quest) return; // Quest doesn't exist

    let prog = await prisma.userQuestProgress.findUnique({
      where: { userId_questId_date: { userId, questId: quest.id, date: today } }
    });

    if (!prog) {
      prog = await prisma.userQuestProgress.create({
        data: { userId, questId: quest.id, date: today, currentVal: amount }
      });
    } else if (prog.currentVal < quest.targetValue) {
      await prisma.userQuestProgress.update({
        where: { userId_questId_date: { userId, questId: quest.id, date: today } },
        data: { currentVal: Math.min(prog.currentVal + amount, quest.targetValue) }
      });
    }
  } catch (error) {
    console.error('Advance quest error:', error);
  }
};
