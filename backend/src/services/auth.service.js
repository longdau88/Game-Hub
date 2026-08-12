const authRepository = require('../repositories/auth.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail } = require('../config/mailer');

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

    return { token, user };
  }
}

module.exports = new AuthService();
