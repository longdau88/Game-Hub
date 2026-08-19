const prisma = require('../config/db');

exports.getCreatorAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gameId } = req.query;

    // Build base filter
    const gameFilter = { uploaderId: userId };
    if (gameId && gameId !== 'all') {
      gameFilter.id = gameId;
    }

    // 1. Get Games matching filter
    const games = await prisma.game.findMany({
      where: gameFilter,
      select: {
        id: true,
        playCount: true,
      }
    });

    const gameIds = games.map(g => g.id);

    // If no games, return empty stats
    if (gameIds.length === 0) {
      return res.json({
        totalPlays: 0,
        activePlayers: 0, // Placeholder
        totalGames: 0,
        performanceData: [],
      });
    }

    // 2. Aggregate Total Plays
    const totalPlays = games.reduce((acc, g) => acc + g.playCount, 0);

    // 3. Get last 7 days performance from GameSession
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sessions = await prisma.gameSession.findMany({
      where: {
        gameId: { in: gameIds },
        startedAt: { gte: sevenDaysAgo }
      },
      select: {
        startedAt: true
      }
    });

    // Group sessions by day (Mon, Tue, etc. or date string)
    const dailyData = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const performanceData = [];
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      dailyData[d.toDateString()] = { name: dayName, plays: 0 };
    }

    sessions.forEach(session => {
      const dateStr = new Date(session.startedAt).toDateString();
      if (dailyData[dateStr]) {
        dailyData[dateStr].plays += 1;
      }
    });

    res.json({
      totalPlays,
      activePlayers: 0, // Currently no real-time live users tracking
      totalGames: games.length,
      performanceData: Object.values(dailyData),
    });
  } catch (error) {
    console.error('Creator Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
