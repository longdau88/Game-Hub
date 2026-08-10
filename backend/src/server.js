const express = require('express');
const cors = require('cors');
require('dotenv').config();
const gameRoutes = require('./routes/game.routes');
const authRoutes = require('./routes/auth.routes');
const prisma = require('./config/db');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/games', gameRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const seedAdmin = async () => {
  try {
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@gamehub.com' } });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@gamehub.com',
          passwordHash,
          role: 'admin',
          isVerified: true
        }
      });
      console.log('Default Admin created: admin@gamehub.com / admin123');
    }
  } catch (error) {
    console.error('Failed to seed admin', error);
  }
};

app.listen(PORT, async () => {
  await seedAdmin();
  console.log(`Server is running on port ${PORT}`);
});
