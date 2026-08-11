const express = require('express');
const cors = require('cors');
require('dotenv').config();
const gameRoutes = require('./routes/game.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const categoryRoutes = require('./routes/category.routes');
const reportRoutes = require('./routes/report.routes');
const settingRoutes = require('./routes/setting.routes');
const userRoutes = require('./routes/user.routes');
const socialRoutes = require('./routes/social.routes');
const prisma = require('./config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;

// Fix Prisma BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Enable CORS for all routes (important for Next.js communicating with Express)
app.use(cors());

// Enable body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Render/Vercel (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Global Rate Limiter: max 200 requests per 10 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 200,
  message: { error: 'Too many requests from this IP, please try again after 10 minutes.' }
});
app.use(globalLimiter);

// Auth Rate Limiter: max 20 requests per 10 minutes for authentication routes
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again after 10 minutes.' }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Game Hub API is running normally.' });
});

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/auth', authLimiter, authRoutes); // Apply stricter rate limiter here
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gamehub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          email: adminEmail,
          passwordHash,
          role: 'admin',
          isVerified: true
        }
      });
      console.log(`Default Admin created: ${adminEmail} (password hidden)`);
    }
  } catch (error) {
    console.error('Failed to seed admin', error);
  }
};

app.listen(PORT, async () => {
  await seedAdmin();
  console.log(`Server is running on port ${PORT}`);
});
