const prisma = require('../config/db');
const { pushToUser } = require('./notification.controller');

// Add or update rating for a game
exports.rateGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { score } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Anti-spam: Ensure user has played the game for at least 120 seconds
    const session = await prisma.gameSession.aggregate({
      where: { userId: req.user.userId, gameId },
      _sum: { sessionLength: true }
    });
    if (!session._sum.sessionLength || session._sum.sessionLength < 120) {
      return res.status(403).json({ error: 'You must play the game for at least 2 minutes before rating.' });
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_gameId: {
          userId: req.user.userId,
          gameId
        }
      },
      update: { score, addedAt: new Date() },
      create: {
        userId: req.user.userId,
        gameId,
        score
      }
    });

    res.json({ message: 'Rating saved', rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Add a comment to a game
exports.addComment = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Anti-spam: Ensure user has played the game for at least 120 seconds
    const session = await prisma.gameSession.aggregate({
      where: { userId: req.user.userId, gameId },
      _sum: { sessionLength: true }
    });
    if (!session._sum.sessionLength || session._sum.sessionLength < 120) {
      return res.status(403).json({ error: 'You must play the game for at least 2 minutes before commenting.' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user.userId,
        gameId,
        content: content.trim()
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    // Notify game uploader if it's not their own comment
    if (game.uploaderId && game.uploaderId !== req.user.userId) {
      const notif = await prisma.notification.create({
        data: {
          userId: game.uploaderId,
          type: 'NEW_COMMENT',
          title: 'New Comment',
          message: `${comment.user.username} commented on your game "${game.title}".`,
          link: `/game/play?id=${game.id}`
        }
      });
      pushToUser(game.uploaderId, notif);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get comments for a game
exports.getComments = async (req, res) => {
  try {
    const { gameId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get user rating for a game
exports.getUserRating = async (req, res) => {
  try {
    const { gameId } = req.params;

    const rating = await prisma.rating.findUnique({
      where: {
        userId_gameId: {
          userId: req.user.userId,
          gameId
        }
      }
    });

    res.json({ rating: rating ? rating.score : null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
