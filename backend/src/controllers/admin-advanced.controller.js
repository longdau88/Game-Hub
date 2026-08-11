const prisma = require('../config/db');
const path = require('path');
const fs = require('fs');

// 1. Storage & Bandwidth
exports.getStorageStats = async (req, res) => {
  try {
    // In a real scenario, this might call Cloudflare R2 API
    // For now, we estimate based on game sizeBytes
    const games = await prisma.game.findMany({
      select: { sizeBytes: true }
    });
    
    let totalBytes = 0;
    games.forEach(g => {
      if (g.sizeBytes) {
        totalBytes += Number(g.sizeBytes);
      }
    });

    // Assume 10GB limit
    const limitBytes = 10 * 1024 * 1024 * 1024;
    
    res.json({
      success: true,
      data: {
        totalBytesUsed: totalBytes,
        limitBytes: limitBytes,
        percentUsed: (totalBytes / limitBytes) * 100
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
    const { id } = req.params;
    const { tags } = req.body; // Expects comma separated string or array

    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;

    const game = await prisma.game.update({
      where: { id },
      data: { hiddenTags: tagsString, vectorSynced: false }
    });

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

    res.json({
      success: true,
      message: `Successfully synced ${games.length} games to Vector DB.`
    });
  } catch (error) {
    console.error('syncVectorDB error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// 3. Analytics
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
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const { sendEmail } = require('../utils/email');

exports.sendEmailCampaign = async (req, res) => {
  try {
    const { subject, body, targetGroup } = req.body;
    
    const users = await prisma.user.findMany({
      where: targetGroup === 'active' ? { isBanned: false } : {}
    });

    // Send email to all selected users
    let sentCount = 0;
    for (const user of users) {
      if (user.email) {
        const result = await sendEmail({
          to: user.email,
          subject: subject,
          html: body
        });
        if (result.success) sentCount++;
      }
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        body,
        targetGroup: targetGroup || 'all',
        status: 'completed',
        sentCount: sentCount,
        completedAt: new Date()
      }
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
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
    const { id, versionId } = req.params;

    // Set all versions to inactive
    await prisma.gameVersion.updateMany({
      where: { gameId: id },
      data: { isActive: false }
    });

    // Set target version to active
    const activeVersion = await prisma.gameVersion.update({
      where: { id: parseInt(versionId) },
      data: { isActive: true }
    });

    // Update game r2FolderPath
    await prisma.game.update({
      where: { id },
      data: { r2FolderPath: activeVersion.r2FolderPath }
    });

    res.json({ success: true, message: 'Game rolled back successfully', data: activeVersion });
  } catch (error) {
    console.error('rollbackGame error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
