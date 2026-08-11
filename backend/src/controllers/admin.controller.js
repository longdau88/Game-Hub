const prisma = require('../config/db');
const r2Client = require('../config/r2');
const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

// Helper to delete folder in R2
const deleteR2Folder = async (folderPath) => {
  const bucketName = process.env.R2_BUCKET_NAME;
  
  try {
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
      const listParams = {
        Bucket: bucketName,
        Prefix: folderPath,
        ContinuationToken: continuationToken,
      };
      
      const listRes = await r2Client.send(new ListObjectsV2Command(listParams));
      
      if (listRes.Contents && listRes.Contents.length > 0) {
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: listRes.Contents.map((item) => ({ Key: item.Key })),
            Quiet: true,
          },
        };
        await r2Client.send(new DeleteObjectsCommand(deleteParams));
      }

      isTruncated = listRes.IsTruncated;
      continuationToken = listRes.NextContinuationToken;
    }
  } catch (error) {
    console.error(`Failed to delete folder ${folderPath} from R2:`, error);
  }
};

// Helper to write audit log (never throws, fire-and-forget safe)
const logAudit = async (adminId, action, entity, details = {}) => {
  try {
    await prisma.auditLog.create({
      data: { adminId, action, entity, details }
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write log:', err.message);
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const pendingGamesCount = await prisma.game.count({ where: { status: 'pending' } });
    const publishedGamesCount = await prisma.game.count({ where: { status: 'published' } });
    const totalUsersCount = await prisma.user.count();
    
    const sizeAggregation = await prisma.game.aggregate({
      _sum: { sizeBytes: true }
    });
    const totalStorageBytes = Number(sizeAggregation._sum.sizeBytes || 0);
    
    res.json({ pendingGamesCount, publishedGamesCount, totalUsersCount, totalStorageBytes });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { games: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      gamesUploaded: user._count.games
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.toggleBanUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { isBanned } = req.body;
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned }
    });
    
    await logAudit(adminId, isBanned ? 'BAN_USER' : 'UNBAN_USER', 'User', {
      targetUserId: user.id,
      targetUsername: user.username || user.email,
      isBanned
    });
    
    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle ban status' });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { role } = req.body;
    
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    });
    
    await logAudit(adminId, 'CHANGE_USER_ROLE', 'User', {
      targetUserId: user.id,
      targetUsername: user.username || user.email,
      newRole: role
    });
    
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

const { sendEmail } = require('../utils/email');

exports.rejectGame = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { rejectReason } = req.body;
    
    const game = await prisma.game.update({
      where: { id },
      data: { status: 'rejected', rejectReason },
      include: { uploader: true }
    });
    
    if (game.uploader) {
      await prisma.notification.create({
        data: {
          userId: game.uploader.id,
          type: 'GAME_REJECTED',
          title: 'Game Rejected',
          message: `Your game "${game.title}" was rejected. Reason: ${rejectReason || 'None specified.'}`,
          link: '/creator'
        }
      });
    }

    await logAudit(adminId, 'REJECT_GAME', 'Game', {
      gameId: id,
      gameTitle: game.title,
      reason: rejectReason
    });
    
    if (game.uploader && game.uploader.email) {
      await sendEmail({
        to: game.uploader.email,
        subject: `[Game Hub] Your game "${game.title}" was rejected`,
        html: `
          <h3>Hello ${game.uploader.username},</h3>
          <p>Unfortunately, your game <strong>${game.title}</strong> has been rejected by our moderation team.</p>
          <p><strong>Reason:</strong> ${rejectReason || 'No specific reason provided.'}</p>
          <p>You can edit your game details and submit it again for approval.</p>
          <p>Best regards,<br/>The Game Hub Team</p>
        `
      });
    }
    
    res.json({ message: 'Game rejected successfully', game });
  } catch (error) {
    console.error("Reject game error:", error);
    res.status(500).json({ error: 'Failed to reject game' });
  }
};

exports.deleteGame = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    if (game.r2FolderPath && game.r2FolderPath !== "") {
      await deleteR2Folder(game.r2FolderPath);
    }
    
    await prisma.userLibrary.deleteMany({ where: { gameId: id } });
    await prisma.game.delete({ where: { id } });
    
    await logAudit(adminId, 'DELETE_GAME', 'Game', {
      gameId: id,
      gameTitle: game.title,
      uploaderId: game.uploaderId,
      r2FolderPath: game.r2FolderPath
    });
    
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};

exports.toggleFeaturedGame = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { isFeatured } = req.body;
    
    const game = await prisma.game.update({
      where: { id },
      data: { isFeatured }
    });
    
    await logAudit(adminId, isFeatured ? 'FEATURE_GAME' : 'UNFEATURE_GAME', 'Game', {
      gameId: id,
      gameTitle: game.title,
      isFeatured
    });
    
    res.json({ message: `Game ${isFeatured ? 'featured' : 'unfeatured'} successfully`, game });
  } catch (error) {
    console.error("Toggle featured error:", error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
};

const fs = require('fs');
const os = require('os');
const path = require('path');

exports.getStorageStats = async (req, res) => {
  try {
    const result = await prisma.game.aggregate({ _sum: { sizeBytes: true } });
    const usedBytes = result._sum.sizeBytes || 0;
    const totalBytes = 10 * 1024 * 1024 * 1024;
    
    res.json({
      success: true,
      data: {
        totalBytes: Number(usedBytes),
        totalBytesLimit: totalBytes,
        percentage: (Number(usedBytes) / totalBytes) * 100
      }
    });
  } catch (error) {
    console.error("Storage stats error:", error);
    res.status(500).json({ error: 'Failed to fetch storage stats' });
  }
};

exports.garbageCollect = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const tmpDir = os.tmpdir();
    let deletedFiles = 0;
    let deletedDirs = 0;

    const files = fs.readdirSync(tmpDir);
    files.forEach(file => {
      if (file.startsWith('game-extract-')) {
        const fullPath = path.join(tmpDir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          deletedDirs++;
        }
      }
      if (file.endsWith('.zip') && file.startsWith('upload-')) {
         const fullPath = path.join(tmpDir, file);
         fs.unlinkSync(fullPath);
         deletedFiles++;
      }
    });

    if (adminId) {
      await logAudit(adminId, 'RUN_GC', 'System', { deletedDirs, deletedFiles });
    }

    res.json({ 
      message: 'Garbage collection completed successfully',
      details: { deletedDirs, deletedFiles }
    });
  } catch (error) {
    console.error("Garbage collection error:", error);
    res.status(500).json({ error: 'Failed to run garbage collection' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        admin: {
          select: { username: true, email: true }
        }
      }
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
