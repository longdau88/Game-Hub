const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get stats: Total uploaded games
    const uploadedGames = await prisma.game.count({
      where: { uploaderId: user.id }
    });

    // Total play counts of uploaded games
    const games = await prisma.game.findMany({
      where: { uploaderId: user.id },
      select: { playCount: true }
    });
    
    const totalPlays = games.reduce((acc, game) => acc + game.playCount, 0);

    res.json({
      ...user,
      stats: {
        uploadedGames,
        totalPlays
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update current user profile
exports.updateMe = async (req, res) => {
  try {
    const { username, avatarUrl } = req.body;
    const updateData = {};

    if (username) {
      // Check if username is already taken by someone else
      const existingUser = await prisma.user.findFirst({
        where: { 
          username,
          id: { not: req.user.userId }
        }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      updateData.username = username;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash }
    });

    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
