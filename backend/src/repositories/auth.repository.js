const prisma = require('../config/db');

class AuthRepository {
  async findUserByEmailOrUsername(email, username) {
    return prisma.user.findFirst({
      where: {
        OR: [{ email }, username ? { username } : undefined].filter(Boolean)
      }
    });
  }

  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async upsertOtp(email, code, expiresAt) {
    return prisma.otpCode.upsert({
      where: { email },
      update: { code, expiresAt, createdAt: new Date() },
      create: { email, code, expiresAt }
    });
  }

  async findOtpByEmail(email) {
    return prisma.otpCode.findUnique({
      where: { email }
    });
  }

  async deleteOtp(email) {
    return prisma.otpCode.delete({
      where: { email }
    });
  }

  async createUser(data) {
    return prisma.user.create({ data });
  }

  async findUserByVerificationToken(token) {
    return prisma.user.findFirst({
      where: { verificationToken: token }
    });
  }

  async verifyUser(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        verificationToken: null
      }
    });
  }
}

module.exports = new AuthRepository();
