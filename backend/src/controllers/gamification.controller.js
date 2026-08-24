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

// Quests
const getPeriodKey = (frequency) => {
  const now = new Date();
  switch (frequency) {
    case 'DAILY':
      return now.toISOString().split('T')[0];
    case 'WEEKLY': {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
    }
    case 'MONTHLY':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    case 'LIFETIME':
    default:
      return 'LIFETIME';
  }
};

const ensureDefaultQuests = async () => {
  const defaultQuests = [
    // DAILY
    { title: 'Play a Game', targetType: 'play_game', targetValue: 1, rewardXp: 50, frequency: 'DAILY', description: 'Chơi bất kỳ một game nào trong hôm nay.' },
    { title: 'Rate a Game', targetType: 'rate_game', targetValue: 1, rewardXp: 30, frequency: 'DAILY', description: 'Đánh giá 1 game.' },
    { title: 'Daily Login', targetType: 'login', targetValue: 1, rewardXp: 20, frequency: 'DAILY', description: 'Đăng nhập vào hệ thống.' },
    { title: 'Add a Friend', targetType: 'add_friend', targetValue: 1, rewardXp: 30, frequency: 'DAILY', description: 'Kết bạn với 1 người mới.' },
    { title: 'Play 3 Games', targetType: 'play_game', targetValue: 3, rewardXp: 100, frequency: 'DAILY', description: 'Hoàn thành 3 game trong ngày hôm nay.' },
    
    // WEEKLY
    { title: 'Play 10 Games', targetType: 'play_game', targetValue: 10, rewardXp: 500, frequency: 'WEEKLY', description: 'Chơi 10 lượt game trong tuần.' },
    { title: 'Rate 3 Games', targetType: 'rate_game', targetValue: 3, rewardXp: 200, frequency: 'WEEKLY', description: 'Để lại đánh giá cho 3 game khác nhau.' },
    { title: 'Follow 2 Creators', targetType: 'follow_creator', targetValue: 2, rewardXp: 150, frequency: 'WEEKLY', description: 'Theo dõi 2 Creator mới.' },
    { title: 'Make 3 Friends', targetType: 'add_friend', targetValue: 3, rewardXp: 200, frequency: 'WEEKLY', description: 'Thêm 3 người bạn mới trong tuần này.' },
    { title: 'Play 25 Games', targetType: 'play_game', targetValue: 25, rewardXp: 1500, frequency: 'WEEKLY', description: 'Cày 25 lượt game trong 1 tuần!' },

    // MONTHLY
    { title: 'Monthly Gamer', targetType: 'play_game', targetValue: 50, rewardXp: 3000, frequency: 'MONTHLY', description: 'Chơi tổng cộng 50 game trong tháng này.' },
    { title: 'Monthly Critic', targetType: 'rate_game', targetValue: 10, rewardXp: 1000, frequency: 'MONTHLY', description: 'Đánh giá 10 game trong tháng.' },
    { title: 'Social Butterfly', targetType: 'add_friend', targetValue: 10, rewardXp: 1000, frequency: 'MONTHLY', description: 'Có 10 người bạn mới trong tháng.' },
    { title: 'Support Creators', targetType: 'follow_creator', targetValue: 5, rewardXp: 800, frequency: 'MONTHLY', description: 'Theo dõi 5 Creator trong tháng.' },
    { title: 'Monthly Champion', targetType: 'play_game', targetValue: 100, rewardXp: 10000, frequency: 'MONTHLY', description: 'Thành tích cực khủng: Chơi 100 game trong tháng!' },

    // LIFETIME
    { title: 'Veteran Gamer', targetType: 'play_game', targetValue: 500, rewardXp: 50000, frequency: 'LIFETIME', description: 'Cột mốc cày cuốc: Chơi tổng cộng 500 game.' },
    { title: 'Master Critic', targetType: 'rate_game', targetValue: 50, rewardXp: 10000, frequency: 'LIFETIME', description: 'Viết 50 đánh giá trên nền tảng.' },
    { title: 'Popular Player', targetType: 'add_friend', targetValue: 50, rewardXp: 15000, frequency: 'LIFETIME', description: 'Kết bạn với 50 người.' },
    { title: 'Creator Fan', targetType: 'follow_creator', targetValue: 20, rewardXp: 10000, frequency: 'LIFETIME', description: 'Theo dõi 20 Creators.' },
    { title: 'The Legend', targetType: 'play_game', targetValue: 2000, rewardXp: 200000, frequency: 'LIFETIME', description: 'Huyền thoại Game Hub: Chơi 2000 lượt game.' }
  ];
  
  const count = await prisma.quest.count();
  if (count === 0) {
    for (const q of defaultQuests) {
      await prisma.quest.create({ data: q });
    }
  }
};

exports.getQuests = async (req, res) => {
  try {
    await ensureDefaultQuests();
    const userId = req.user.userId;

    const quests = await prisma.quest.findMany();
    
    // Get or create progress
    const progressList = await Promise.all(quests.map(async (q) => {
      const periodKey = getPeriodKey(q.frequency);
      let prog = await prisma.userQuestProgress.findUnique({
        where: { userId_questId_periodKey: { userId, questId: q.id, periodKey } }
      });
      
      if (!prog) {
        // Automatically start the 'login' quest since they are fetching quests
        let initialVal = 0;
        if (q.targetType === 'login') {
          initialVal = 1;
        }
        prog = await prisma.userQuestProgress.create({
          data: { userId, questId: q.id, periodKey, currentVal: initialVal }
        });
      } else if (q.targetType === 'login' && prog.currentVal < q.targetValue && q.frequency === 'DAILY') {
         // Failsafe: if daily login wasn't recorded
         prog = await prisma.userQuestProgress.update({
           where: { userId_questId_periodKey: { userId, questId: q.id, periodKey } },
           data: { currentVal: 1 }
         });
      }
      return { ...q, progress: prog, periodKey };
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

    const quest = await prisma.quest.findUnique({ where: { id: parseInt(questId) } });
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    const periodKey = getPeriodKey(quest.frequency);
    const progress = await prisma.userQuestProgress.findUnique({
      where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } }
    });

    if (!progress) return res.status(400).json({ error: 'No progress found' });
    if (progress.isCompleted) return res.status(400).json({ error: 'Reward already claimed' });
    if (progress.currentVal < quest.targetValue) return res.status(400).json({ error: 'Quest not completed yet' });

    // Mark as completed
    await prisma.userQuestProgress.update({
      where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
      data: { isCompleted: true, claimedAt: new Date() }
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
    const quests = await prisma.quest.findMany({ where: { targetType } });
    if (!quests.length) return; // No quests exist for this target type

    for (const quest of quests) {
      const periodKey = getPeriodKey(quest.frequency);
      
      let prog = await prisma.userQuestProgress.findUnique({
        where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } }
      });

      if (!prog) {
        prog = await prisma.userQuestProgress.create({
          data: { userId, questId: quest.id, periodKey, currentVal: amount }
        });
      } else if (prog.currentVal < quest.targetValue) {
        await prisma.userQuestProgress.update({
          where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
          data: { currentVal: Math.min(prog.currentVal + amount, quest.targetValue) }
        });
      }
    }
  } catch (error) {
    console.error('Advance quest error:', error);
  }
};

// Admin: Get all quests
exports.getAllQuests = async (req, res) => {
  try {
    const quests = await prisma.quest.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

// Admin: Create Quest
exports.createQuest = async (req, res) => {
  try {
    const { title, description, targetType, targetValue, rewardXp, frequency } = req.body;
    const quest = await prisma.quest.create({
      data: {
        title,
        description,
        targetType,
        targetValue: parseInt(targetValue) || 1,
        rewardXp: parseInt(rewardXp) || 10,
        frequency: frequency || 'DAILY'
      }
    });
    const auditLogService = require('../services/auditLog.service');
    await auditLogService.log(req.user.userId, 'CREATE_QUEST', 'Quest', { questId: quest.id });
    res.status(201).json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quest' });
  }
};

// Admin: Update Quest
exports.updateQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, targetType, targetValue, rewardXp, frequency } = req.body;
    const quest = await prisma.quest.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        targetType,
        targetValue: parseInt(targetValue) || 1,
        rewardXp: parseInt(rewardXp) || 10,
        frequency: frequency || 'DAILY'
      }
    });
    const auditLogService = require('../services/auditLog.service');
    await auditLogService.log(req.user.userId, 'UPDATE_QUEST', 'Quest', { questId: quest.id });
    res.json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quest' });
  }
};

// Admin: Delete Quest
exports.deleteQuest = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quest.delete({
      where: { id: parseInt(id) }
    });
    const auditLogService = require('../services/auditLog.service');
    await auditLogService.log(req.user.userId, 'DELETE_QUEST', 'Quest', { questId: id });
    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quest' });
  }
};

