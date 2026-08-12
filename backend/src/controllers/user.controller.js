const userService = require('../services/user.service');

class UserController {
  async getMe(req, res) {
    try {
      const profile = await userService.getProfile(req.user.userId);
      res.json(profile);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async updateMe(req, res) {
    try {
      const updatedUser = await userService.updateProfile(req.user.userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async changePassword(req, res) {
    try {
      await userService.changePassword(req.user.userId, req.body);
      res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }
}

module.exports = new UserController();
