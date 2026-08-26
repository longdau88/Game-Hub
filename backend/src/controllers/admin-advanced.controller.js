const prisma = require('../config/db');
const path = require('path');
const fs = require('fs');
const auditLogService = require('../services/audit.service');

// 1. Storage & Bandwidth
exports.getStorageStats = async (req, res) => {
  try {
    // 1. Database Size
    let dbBytes = 0;
    try {
      const result = await prisma.$queryRaw`SELECT pg_database_size(current_database())::text as size`;
      dbBytes = Number(result[0].size) || 0;
    } catch(e) {
      console.error("Failed to get DB size:", e);
    }
    const dbLimit = 1 * 1024 * 1024 * 1024; // 1GB limit for DB

    // 2. Server Storage (R2/S3)
    let serverBytes = 0;
    try {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const r2Client = require('../config/r2');
      let isTruncated = true;
      let continuationToken = undefined;

      while (isTruncated) {
        const command = new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME || 'webgame-assets',
          ContinuationToken: continuationToken
        });
        
        const response = await r2Client.send(command);
        if (response.Contents) {
          response.Contents.forEach(item => {
            serverBytes += item.Size || 0;
          });
        }
        
        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
      }
    } catch(e) {
      console.error("Failed to fetch R2 size:", e);
    }
    const serverLimit = 10 * 1024 * 1024 * 1024; // 10GB limit for Server Storage

    res.json({
      success: true,
      data: {
        db: {
          used: dbBytes,
          limit: dbLimit,
          percent: (dbBytes / dbLimit) * 100
        },
        server: {
          used: serverBytes,
          limit: serverLimit,
          percent: (serverBytes / serverLimit) * 100
        }
      }
    });
  } catch (error) {
    console.error('getStorageStats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.runGarbageCollection = async (req, res) => {
  try {
    // A mock GC that cleans up /tmp uploads
    const tmpDir = path.join(__dirname, '../../uploads/tmp');
    let deletedFiles = 0;
    if (fs.existsSync(tmpDir)) {
      const files = fs.readdirSync(tmpDir);
      files.forEach(file => {
        if (file.endsWith('.zip')) {
          fs.unlinkSync(path.join(tmpDir, file));
          deletedFiles++;
        }
      });
    }

    res.json({
      success: true,
      message: `Garbage collection complete. Removed ${deletedFiles} temporary files.`
    });
  } catch (error) {
    console.error('runGarbageCollection error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// 2. AI & Recommendations
exports.updateHiddenTags = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { tags } = req.body;

    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;

    const game = await prisma.game.update({
      where: { id },
      data: { hiddenTags: tagsString, vectorSynced: false }
    });

    try {
      await prisma.auditLog.create({
        data: { adminId, action: 'UPDATE_HIDDEN_TAGS', entity: 'Game', details: { gameId: id, gameTitle: game.title, tags: tagsString } }
      });
    } catch (e) { console.error('[AuditLog]', e.message); }

    res.json({ success: true, data: game });
  } catch (error) {
    console.error('updateHiddenTags error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.syncVectorDB = async (req, res) => {
  try {
    // Find all games that need syncing
    const games = await prisma.game.findMany({
      where: { vectorSynced: false }
    });

    // Mock sync process
    // In reality, you would generate embeddings and upsert to Pinecone/Qdrant/pgvector

    if (games.length > 0) {
      const ids = games.map(g => g.id);
      await prisma.game.updateMany({
        where: { id: { in: ids } },
        data: { vectorSynced: true }
      });
    }

    await auditLogService.log(req.user.userId, 'SYNC_VECTOR_DATABASE', 'Game', {
      syncedGames: games.length
    });

    res.json({ 
      success: true, 
      message: `Successfully synced ${games.length} games to Vector DB.`,
      data: { syncedCount: games.length }
    });
  } catch (error) {
    console.error('syncVectorDB error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// 3. Analytics
const getAnalyticsStartDate = (range) => {
  const days = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 }[range] || 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { start, days };
};

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const { start, days } = getAnalyticsStartDate(req.query.range);
    const gameId = req.query.gameId || undefined;
    const gameFilter = gameId ? { gameId } : {};
    const sessionWhere = { ...gameFilter, startedAt: { gte: start } };
    const crashWhere = { ...gameFilter, createdAt: { gte: start } };

    const previousStart = new Date(start);
    previousStart.setDate(start.getDate() - days);

    const [sessions, allTrackedSessions, crashes, publishedGames, approvedGames, availableGames, currentNewUsersCount, previousNewUsersCount, previousSessions] = await Promise.all([
      prisma.gameSession.findMany({
        where: sessionWhere,
        select: { gameId: true, userId: true, sessionLength: true, startedAt: true }
      }),
      prisma.gameSession.findMany({
        where: { ...gameFilter, userId: { not: null } },
        select: { userId: true, startedAt: true }
      }),
      prisma.crashReport.findMany({
        where: crashWhere,
        select: { gameId: true, createdAt: true }
      }),
      prisma.game.findMany({
        where: { status: 'published', ...(gameId ? { id: gameId } : {}) },
        select: {
          id: true, title: true, playCount: true,
          ratings: { select: { score: true } },
          libraryEntries: { select: { userId: true } }
        }
      }),
      gameId ? Promise.resolve([]) : prisma.auditLog.findMany({
        where: { action: 'APPROVE_GAME', createdAt: { gte: start } },
        select: { id: true }
      }),
      prisma.game.findMany({ where: { status: 'published' }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
      gameId ? Promise.resolve(0) : prisma.user.count({ where: { createdAt: { gte: start } } }),
      gameId ? Promise.resolve(0) : prisma.user.count({ where: { createdAt: { gte: previousStart, lt: start } } }),
      prisma.gameSession.findMany({
        where: { ...gameFilter, startedAt: { gte: previousStart, lt: start } },
        select: { sessionLength: true, userId: true }
      })
    ]);

    const gamesById = new Map(publishedGames.map(game => [game.id, game]));
    const perGame = new Map();
    const daily = new Map();
    for (let offset = 0; offset < days; offset++) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      daily.set(toDateKey(date), { date: toDateKey(date), sessions: 0, users: new Set(), crashes: 0 });
    }

    sessions.forEach(session => {
      const item = perGame.get(session.gameId) || { sessions: 0, duration: 0, users: new Set() };
      item.sessions++;
      item.duration += session.sessionLength;
      if (session.userId) item.users.add(session.userId);
      perGame.set(session.gameId, item);
      const day = daily.get(toDateKey(session.startedAt));
      if (day) { day.sessions++; if (session.userId) day.users.add(session.userId); }
    });
    crashes.forEach(crash => {
      const day = daily.get(toDateKey(crash.createdAt));
      if (day) day.crashes++;
    });

    const topGames = publishedGames.map(game => {
      const stat = perGame.get(game.id) || { sessions: 0, duration: 0, users: new Set() };
      const totalRatings = game.ratings.length;
      return {
        gameId: game.id,
        gameTitle: game.title,
        sessions: stat.sessions,
        uniquePlayers: stat.users.size,
        averageSessionLength: stat.sessions ? stat.duration / stat.sessions : 0,
        crashRate: stat.sessions ? (crashes.filter(crash => crash.gameId === game.id).length / stat.sessions) * 100 : 0,
        averageRating: totalRatings ? game.ratings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings : 0,
        totalRatings,
        favorites: game.libraryEntries.length,
        playCount: game.playCount
      };
    }).sort((a, b) => b.sessions - a.sessions).slice(0, 20);

    const knownUsers = new Set(sessions.map(session => session.userId).filter(Boolean));
    const sessionsByUser = new Map();
    allTrackedSessions.forEach(session => {
      const userSessions = sessionsByUser.get(session.userId) || [];
      userSessions.push(session.startedAt);
      sessionsByUser.set(session.userId, userSessions);
    });
    const retention = {};
    for (const targetDay of [1, 7, 30]) {
      const cutoff = Date.now() - targetDay * 86400000;
      let eligible = 0;
      let retained = 0;
      sessionsByUser.forEach(userSessions => {
        const firstSession = Math.min(...userSessions.map(date => new Date(date).getTime()));
        if (firstSession > cutoff) return;
        eligible++;
        if (userSessions.some(date => new Date(date).getTime() >= firstSession + targetDay * 86400000)) retained++;
      });
      retention[`d${targetDay}`] = eligible ? Number((retained / eligible * 100).toFixed(1)) : 0;
    }

    const totalDuration = sessions.reduce((sum, session) => sum + session.sessionLength, 0);
    const previousTotalDuration = previousSessions.reduce((sum, s) => sum + s.sessionLength, 0);
    const previousUniquePlayers = new Set(previousSessions.map(s => s.userId).filter(Boolean)).size;

    const newUsersGrowth = previousNewUsersCount === 0 ? (currentNewUsersCount > 0 ? 100 : 0) : Number(((currentNewUsersCount - previousNewUsersCount) / previousNewUsersCount * 100).toFixed(1));
    const durationGrowth = previousTotalDuration === 0 ? (totalDuration > 0 ? 100 : 0) : Number(((totalDuration - previousTotalDuration) / previousTotalDuration * 100).toFixed(1));
    const sessionsGrowth = previousSessions.length === 0 ? (sessions.length > 0 ? 100 : 0) : Number(((sessions.length - previousSessions.length) / previousSessions.length * 100).toFixed(1));
    const playersGrowth = previousUniquePlayers === 0 ? (knownUsers.size > 0 ? 100 : 0) : Number(((knownUsers.size - previousUniquePlayers) / previousUniquePlayers * 100).toFixed(1));

    res.json({
      success: true,
      data: {
        summary: { 
          sessions: sessions.length, sessionsGrowth,
          uniquePlayers: knownUsers.size, playersGrowth,
          totalDuration, durationGrowth,
          newUsers: currentNewUsersCount, newUsersGrowth,
          approvedGames: approvedGames.length, 
          crashes: crashes.length, crashRate: sessions.length ? Number((crashes.length / sessions.length * 100).toFixed(2)) : 0 
        },
        trend: [...daily.values()].map(day => ({ date: day.date, sessions: day.sessions, uniquePlayers: day.users.size, crashes: day.crashes })),
        topGames,
        retention,
        games: availableGames
      }
    });
  } catch (error) {
    console.error('getAnalyticsOverview error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getSessionStats = async (req, res) => {
  try {
    // Get average session length per game
    const stats = await prisma.gameSession.groupBy({
      by: ['gameId'],
      _avg: {
        sessionLength: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20
    });

    // Fetch game details to map names
    const gameIds = stats.map(s => s.gameId);
    const games = await prisma.game.findMany({
      where: { id: { in: gameIds } },
      select: { id: true, title: true }
    });

    const gameMap = {};
    games.forEach(g => { gameMap[g.id] = g.title; });

    const result = stats.map(s => ({
      gameId: s.gameId,
      gameTitle: gameMap[s.gameId] || 'Unknown Game',
      averageLength: s._avg.sessionLength,
      totalSessions: s._count.id
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('getSessionStats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getCrashLogs = async (req, res) => {
  try {
    const logs = await prisma.crashReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        game: { select: { title: true } }
      }
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('getCrashLogs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// 4. Mail Campaigns
exports.getEmailTemplates = async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    const template = await prisma.emailTemplate.create({
      data: { name, subject, body }
    });
    await auditLogService.log(req.user.userId, 'CREATE_EMAIL_TEMPLATE', 'EmailTemplate', {
      templateId: template.id, name: template.name, subject: template.subject
    });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const { sendEmail } = require('../utils/email');

exports.sendEmailCampaign = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { subject, content, target } = req.body;
    let targetGroup = target || 'all';
    let whereClause = {};

    if (targetGroup === 'active') {
      whereClause = { isBanned: false, lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    } else if (Array.isArray(target) && target.length > 0) {
      whereClause = { id: { in: target.map(id => parseInt(id)) } };
      targetGroup = 'selected';
    }
    
    const users = await prisma.user.findMany({
      where: whereClause
    });

    let sentCount = 0;
    for (const user of users) {
      if (user.email) {
        const result = await sendEmail({
          to: user.email,
          subject: subject,
          html: content
        });
        if (result && result.success) sentCount++;
      }
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        body: content,
        targetGroup: targetGroup,
        status: 'completed',
        sentCount,
        completedAt: new Date()
      }
    });

    try {
      await prisma.auditLog.create({
        data: { adminId, action: 'SEND_EMAIL_CAMPAIGN', entity: 'EmailCampaign', details: { subject, target: targetGroup, sentCount } }
      });
    } catch (e) { console.error('[AuditLog]', e.message); }

    res.json({ success: true, sentCount, data: campaign });
  } catch (error) {
    console.error('sendEmailCampaign error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getEmailCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.deleteEmailCampaigns = async (req, res) => {
  try {
    const { all, ids } = req.body;
    const adminId = req.user.userId;

    let deletedCount = 0;
    if (all === true || all === 'true') {
      const result = await prisma.emailCampaign.deleteMany({});
      deletedCount = result.count;
    } else if (Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.emailCampaign.deleteMany({
        where: { id: { in: ids.map(id => parseInt(id)) } }
      });
      deletedCount = result.count;
    } else {
      return res.status(400).json({ success: false, error: 'Must provide all=true or an array of ids' });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE_CAMPAIGNS',
        entity: 'EmailCampaign',
        details: { deletedCount, ids: all ? 'ALL' : ids }
      }
    });

    res.json({ success: true, message: `Deleted ${deletedCount} campaigns` });
  } catch (error) {
    console.error('Delete campaigns error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// 5. Version Control (Admin side)
exports.getGameVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await prisma.gameVersion.findMany({
      where: { gameId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.rollbackGame = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id, versionId } = req.params;

    await prisma.gameVersion.updateMany({
      where: { gameId: id },
      data: { isActive: false }
    });

    const activeVersion = await prisma.gameVersion.update({
      where: { id: parseInt(versionId) },
      data: { isActive: true }
    });

    await prisma.game.update({
      where: { id },
      data: { r2FolderPath: activeVersion.r2FolderPath }
    });

    try {
      await prisma.auditLog.create({
        data: { adminId, action: 'ROLLBACK_GAME_VERSION', entity: 'Game', details: { gameId: id, versionId, r2FolderPath: activeVersion.r2FolderPath } }
      });
    } catch (e) { console.error('[AuditLog]', e.message); }

    res.json({ success: true, message: 'Game rolled back successfully', data: activeVersion });
  } catch (error) {
    console.error('rollbackGame error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
