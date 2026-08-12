const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');

class UserService {
  async getProfile(userId) {
    const { user, stats } = await userRepository.findByIdWithStats(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const totalPlays = stats._sum.playCount || 0;
    const uploadedGames = stats._count || 0;

    return {
      ...user,
      stats: {
        uploadedGames,
        totalPlays
      }
    };
  }

  async updateProfile(userId, { username, avatarUrl }) {
    const updateData = {};

    if (username) {
      const existingUser = await userRepository.findByUsernameExcludingId(username, userId);
      if (existingUser) {
        const error = new Error('Username is already taken');
        error.statusCode = 400;
        throw error;
      }
      updateData.username = username;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    return userRepository.update(userId, updateData);
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      const error = new Error('Mật khẩu hiện tại và mật khẩu mới là bắt buộc.');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findByIdWithPassword(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Mật khẩu hiện tại không đúng.');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.update(userId, { passwordHash });
  }
}

module.exports = new UserService();
