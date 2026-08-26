const authRepository = require('../repositories/auth.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail, sendPasswordResetOtpEmail } = require('../config/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

class AuthService {
  async sendOtp(email, username) {
    if (!email) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await authRepository.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      const error = new Error('User with this email or username already exists');
      error.statusCode = 400;
      throw error;
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 60000); // 1 minute

    await authRepository.upsertOtp(email, code, expiresAt);
    await sendOtpEmail(email, code);
  }

  async register({ username, email, password, code }) {
    if (!username || !email || !password || !code) {
      const error = new Error('Missing required fields');
      error.statusCode = 400;
      throw error;
    }

    const otpRecord = await authRepository.findOtpByEmail(email);

    if (!otpRecord) {
      const error = new Error('Please request a verification code first.');
      error.statusCode = 400;
      throw error;
    }

    if (otpRecord.code !== code) {
      const error = new Error('Invalid verification code.');
      error.statusCode = 400;
      throw error;
    }

    if (otpRecord.expiresAt < new Date()) {
      const error = new Error('Verification code has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await authRepository.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      const error = new Error('User with this email or username already exists');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await authRepository.createUser({
      username,
      email,
      passwordHash,
      role: 'user',
      isVerified: true
    });

    await authRepository.deleteOtp(email);
    return user;
  }

  async verifyEmail(token) {
    if (!token) {
      const error = new Error('Token is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await authRepository.findUserByVerificationToken(token);
    if (!user) {
      const error = new Error('Invalid or expired token');
      error.statusCode = 400;
      throw error;
    }

    await authRepository.verifyUser(user.id);
  }

  async login(email, password) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isVerified) {
      const error = new Error('Please verify your email before logging in.');
      error.statusCode = 403;
      throw error;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Calculate Login Streak
    const now = new Date();
    let newStreak = user.loginStreak || 0;
    let xpGain = 0;
    
    if (user.lastLoginAt) {
      const lastLoginDate = new Date(user.lastLoginAt);
      lastLoginDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - lastLoginDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
        xpGain = 10; // Daily login reward
      } else if (diffDays > 1) {
        newStreak = 1;
        xpGain = 10;
      } else {
        // diffDays === 0, already logged in today
        newStreak = user.loginStreak || 1;
        xpGain = 0;
      }
    } else {
      newStreak = 1;
      xpGain = 10;
    }

    const newXp = (user.xp || 0) + xpGain;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

    await authRepository.updateUserStats(user.id, {
      lastLoginAt: now,
      loginStreak: newStreak,
      xp: newXp,
      level: newLevel
    });

    const updatedUser = { ...user, loginStreak: newStreak, xp: newXp, level: newLevel };

    return { token, user: updatedUser };
  async forgotPassword(email) {
    if (!email) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // User specifically requested this behavior:
      const error = new Error('No corresponding account found for this email');
      error.statusCode = 404;
      throw error;
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    await authRepository.upsertOtp(email, code, expiresAt);
    await sendPasswordResetOtpEmail(email, code);
  }

  async resetPassword({ email, code, newPassword }) {
    if (!email || !code || !newPassword) {
      const error = new Error('Missing required fields');
      error.statusCode = 400;
      throw error;
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const otpRecord = await authRepository.findOtpByEmail(email);
    if (!otpRecord) {
      const error = new Error('Please request a password reset code first.');
      error.statusCode = 400;
      throw error;
    }

    if (otpRecord.code !== code) {
      const error = new Error('Invalid verification code.');
      error.statusCode = 400;
      throw error;
    }

    if (otpRecord.expiresAt < new Date()) {
      const error = new Error('Verification code has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(user.id, passwordHash);
    await authRepository.deleteOtp(email);
  }
}

module.exports = new AuthService();
