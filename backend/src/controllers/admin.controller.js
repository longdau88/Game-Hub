const prisma = require('../config/db');
const r2Client = require('../config/r2');
const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

// Helper to delete folder in R2
const deleteR2Folder = async (folderPath) => {
  const bucketName = process.env.R2_BUCKET_NAME;
  
  try {
    // List all objects in the folder
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

exports.getDashboardStats = async (req, res) => {
  try {
    const pendingGamesCount = await prisma.game.count({ where: { status: 'pending' } });
    const publishedGamesCount = await prisma.game.count({ where: { status: 'published' } });
    const totalUsersCount = await prisma.user.count();
    
    // Approximate R2 storage used by summing sizeBytes in DB
    const sizeAggregation = await prisma.game.aggregate({
      _sum: { sizeBytes: true }
    });
    const totalStorageBytes = Number(sizeAggregation._sum.sizeBytes || 0);
    
    res.json({
      pendingGamesCount,
      publishedGamesCount,
      totalUsersCount,
      totalStorageBytes
    });
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
    
    // Format output
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
    const { id } = req.params;
    const { isBanned } = req.body;
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned }
    });
    
    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle ban status' });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    });
    
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

const { sendEmail } = require('../utils/email');

exports.rejectGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;
    
    const game = await prisma.game.update({
      where: { id },
      data: { 
        status: 'rejected',
        rejectReason
      },
      include: {
        uploader: true
      }
    });
    
    // We do NOT delete files from R2 so the user can edit the game metadata and request re-approval if desired.
    
    // Send email to uploader
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
    const { id } = req.params;
    
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    if (game.r2FolderPath && game.r2FolderPath !== "") {
      await deleteR2Folder(game.r2FolderPath);
    }
    
    // Need to delete dependencies first if any, or let cascading delete handle it if set up.
    // Our schema doesn't have cascade delete for Library, but let's delete it anyway
    await prisma.userLibrary.deleteMany({ where: { gameId: id } });
    
    await prisma.game.delete({ where: { id } });
    
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};

exports.toggleFeaturedGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;
    
    const game = await prisma.game.update({
      where: { id },
      data: { isFeatured }
    });
    
    res.json({ message: `Game ${isFeatured ? 'featured' : 'unfeatured'} successfully`, game });
  } catch (error) {
    console.error("Toggle featured error:", error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
};
