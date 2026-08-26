const authService = require('../services/auth.service');
const userService = require('../services/user.service');

class AuthController {
  async sendOtp(req, res) {
    try {
      const { email, username } = req.body;
      await authService.sendOtp(email, username);
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async register(req, res) {
    try {
      await authService.register(req.body);
      res.status(201).json({ message: 'Registration successful. You can now login.' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      await authService.verifyEmail(token);
      res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      res.json({
        message: 'Login successful',
        token: data.token,
        user: {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          level: data.user.level,
          xp: data.user.xp,
          avatarUrl: data.user.avatarUrl
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async getProfile(req, res) {
    try {
      // Reusing user service logic if needed, but the original just fetched minimal user info.
      // We will use userService.getProfile or just fetch simple details here.
      // We can use the existing userService.getProfile to have a single source of truth.
      const profile = await userService.getProfile(req.user.userId);
      res.json({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        createdAt: profile.createdAt
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.json({ message: 'Password reset OTP sent to email' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async resetPassword(req, res) {
    try {
      await authService.resetPassword(req.body);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }
}

module.exports = new AuthController();
