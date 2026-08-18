const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET /api/leaderboards
// Returns the top 50 users globally based on XP
router.get('/', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        xp: true,
        level: true
      }
    });

    const formatted = topUsers.map(u => ({
      id: u.id,
      name: u.username,
      avatar: u.avatarUrl,
      score: u.xp,
      level: u.level
    }));

    res.json({ data: formatted });
  } catch (error) {
    console.error('Global leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch global leaderboards' });
  }
});

module.exports = router;
