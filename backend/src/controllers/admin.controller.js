const prisma = require('../config/db');
const r2Client = require('../config/r2');
const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { pushToUser } = require('./notification.controller');
const bcrypt = require('bcryptjs');

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
    const adminId = req.user.userId;
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
    const adminId = req.user.userId;
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

exports.createUser = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    
    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'User with email or username already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: role || 'user',
        isVerified: true
      }
    });
    
    await logAudit(adminId, 'CREATE_USER', 'User', {
      targetUserId: user.id,
      targetUsername: user.username
    });
    
    // Omit password hash in response
    delete user.passwordHash;
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    
    const dataToUpdate = {};
    if (username) dataToUpdate.username = username;
    if (email) dataToUpdate.email = email;
    if (role) dataToUpdate.role = role;
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    });
    
    await logAudit(adminId, 'UPDATE_USER', 'User', {
      targetUserId: user.id,
      targetUsername: user.username,
      updatedFields: Object.keys(dataToUpdate).filter(k => k !== 'passwordHash')
    });
    
    delete user.passwordHash;
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email or username already in use' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.sendEmailToUser = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { subject, body } = req.body;
    
    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!targetUser || !targetUser.email) {
      return res.status(404).json({ error: 'User or email not found' });
    }
    
    const result = await sendEmail({
      to: targetUser.email,
      subject,
      html: body
    });
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send email' });
    }
    
    await logAudit(adminId, 'SEND_EMAIL_USER', 'User', {
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      subject
    });
    
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process email request' });
  }
};

const { sendEmail } = require('../utils/email');

exports.rejectGame = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { rejectReason } = req.body;
    
    const game = await prisma.game.update({
      where: { id },
      data: { status: 'rejected', rejectReason },
      include: { uploader: true }
    });
    
    if (game.uploader) {
      const notif = await prisma.notification.create({
        data: {
          userId: game.uploader.id,
          type: 'GAME_REJECTED',
          title: 'Game Rejected',
          message: JSON.stringify({ key: 'notif.gameRejected', params: { title: game.title, reason: rejectReason || 'None specified.' } }),
          link: '/creator'
        }
      });
      pushToUser(game.uploader.id, notif);
    }

    await logAudit(adminId, 'REJECT_GAME', 'Game', {
      gameId: id,
      gameTitle: game.title,
      reason: rejectReason
    });
    
    if (game.uploader && game.uploader.email) {
      const isVi = game.uploader.locale === 'vi';
      const subject = isVi 
        ? `[Game Hub] Game "${game.title}" của bạn đã bị từ chối` 
        : `[Game Hub] Your game "${game.title}" was rejected`;
      const html = isVi 
        ? `
          <h3>Xin chào ${game.uploader.username},</h3>
          <p>Rất tiếc, game <strong>${game.title}</strong> của bạn đã bị đội ngũ kiểm duyệt từ chối.</p>
          <p><strong>Lý do:</strong> ${rejectReason || 'Không có lý do cụ thể.'}</p>
          <p>Bạn có thể chỉnh sửa lại thông tin game và tải lên lại để được xét duyệt.</p>
          <p>Trân trọng,<br/>Đội ngũ Game Hub</p>
        `
        : `
          <h3>Hello ${game.uploader.username},</h3>
          <p>Unfortunately, your game <strong>${game.title}</strong> has been rejected by our moderation team.</p>
          <p><strong>Reason:</strong> ${rejectReason || 'No specific reason provided.'}</p>
          <p>You can edit your game details and submit it again for approval.</p>
          <p>Best regards,<br/>The Game Hub Team</p>
        `;

      await sendEmail({
        to: game.uploader.email,
        subject,
        html
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
    const adminId = req.user.userId;
    const { id } = req.params;
    
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    // Ratings, comments and reports use restrictive foreign keys. Delete every
    // dependent record atomically before deleting the game itself.
    await prisma.$transaction([
      prisma.userLibrary.deleteMany({ where: { gameId: id } }),
      prisma.rating.deleteMany({ where: { gameId: id } }),
      prisma.comment.deleteMany({ where: { gameId: id } }),
      prisma.report.deleteMany({ where: { gameId: id } }),
      prisma.game.delete({ where: { id } })
    ]);

    // Object storage is external to the database transaction. A cleanup issue
    // must not make a successfully deleted game appear as a failed request.
    if (game.r2FolderPath) {
      try {
        await deleteR2Folder(game.r2FolderPath);
      } catch (storageError) {
        console.error('Game deleted but R2 cleanup failed:', storageError);
      }
    }
    
    if (game.uploaderId) {
      const notif = await prisma.notification.create({
        data: {
          userId: game.uploaderId,
          type: 'GAME_DELETED',
          title: 'Game Deleted',
          message: JSON.stringify({ key: 'notif.gameDeleted', params: { title: game.title } }),
          link: '/creator'
        }
      });
      const { pushToUser } = require('./notification.controller');
      pushToUser(game.uploaderId, notif);
    }
    
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
    const adminId = req.user.userId;
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
    const adminId = req.user?.userId;
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

exports.getSupportTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Attach user info if email matches an existing user
    const ticketsWithUser = await Promise.all(tickets.map(async (t) => {
      const user = await prisma.user.findUnique({
        where: { email: t.email },
        select: { id: true, username: true, avatarUrl: true }
      });
      return { ...t, user };
    }));

    res.json({ success: true, data: ticketsWithUser });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
};

exports.markTicketAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.supportTicket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    if (ticket.status === 'OPEN') {
      await prisma.supportTicket.update({
        where: { id: parseInt(id) },
        data: { status: 'READ' }
      });
    }
    res.json({ success: true, message: 'Ticket marked as read' });
  } catch (error) {
    console.error('Mark ticket as read error:', error);
    res.status(500).json({ error: 'Failed to mark ticket as read' });
  }
};

exports.deleteSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.supportTicket.delete({ where: { id: parseInt(id) } });
    
    const adminId = req.user?.userId;
    if (adminId) {
      await logAudit(adminId, 'DELETE_TICKET', 'SupportTicket', { ticketId: id });
    }

    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};

exports.replySupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Send email using existing service
    const { sendEmail } = require('../utils/email');
    await sendEmail({
      to: ticket.email,
      subject: subject,
      html: `<p>Hi there,</p><p>Regarding your request: <i>${ticket.subject}</i></p><p>${body.replace(/\n/g, '<br/>')}</p>`
    });

    // Update status
    await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: { status: 'REPLIED' }
    });

    const adminId = req.user?.userId;
    if (adminId) {
      await logAudit(adminId, 'REPLY_TICKET', 'SupportTicket', { ticketId: id });
    }

    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Reply ticket error:', error);
    res.status(500).json({ error: 'Failed to reply to ticket' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const userId = parseInt(id);

    if (adminId === userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Set games' uploaderId to null instead of deleting games
    await prisma.game.updateMany({
      where: { uploaderId: userId },
      data: { uploaderId: null }
    });

    await prisma.$transaction([
      prisma.userLibrary.deleteMany({ where: { userId } }),
      prisma.rating.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { userId } }),
      prisma.report.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { adminId: userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    await logAudit(adminId, 'DELETE_USER', 'User', {
      targetUserId: userId,
      targetUsername: user.username
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
