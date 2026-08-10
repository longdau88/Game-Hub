const express = require('express');
const cors = require('cors');
require('dotenv').config();
const gameRoutes = require('./routes/game.routes');
const authRoutes = require('./routes/auth.routes');
const prisma = require('./config/db');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all routes (important for Next.js communicating with Express)
app.use(cors());

// Enable body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/auth', authRoutes);

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
