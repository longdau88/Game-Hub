const prisma = require('../config/db');

exports.sendFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username) return res.status(400).json({ error: 'Username is required' });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.id === userId) return res.status(400).json({ error: 'Cannot send request to yourself' });

    // Check existing
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: targetUser.id },
          { userId: targetUser.id, friendId: userId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ error: 'Already friends' });
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId,
        friendId: targetUser.id,
        status: 'pending'
      }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: `You have a new friend request from someone.`, // In a real app we'd fetch the sender's username
        link: '/profile'
      }
    });

    res.json({ message: 'Friend request sent', friendship });
  } catch (error) {
    console.error('sendFriendRequest error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params; // Friendship ID

    const friendship = await prisma.friendship.findUnique({ where: { id: parseInt(id) } });
    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    if (friendship.friendId !== userId) return res.status(403).json({ error: 'Unauthorized to accept this request' });

    const updated = await prisma.friendship.update({
      where: { id: parseInt(id) },
      data: { status: 'accepted' }
    });

    // Notify sender
    await prisma.notification.create({
      data: {
        userId: friendship.userId,
        type: 'FRIEND_ACCEPTED',
        title: 'Friend Request Accepted',
        message: `Your friend request was accepted.`,
        link: '/profile'
      }
    });

    res.json({ message: 'Friend request accepted', friendship: updated });
  } catch (error) {
    console.error('acceptFriendRequest error:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params; // Friendship ID

    const friendship = await prisma.friendship.findUnique({ where: { id: parseInt(id) } });
    if (!friendship) return res.status(404).json({ error: 'Friendship not found' });
    if (friendship.userId !== userId && friendship.friendId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.friendship.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Friend removed/request cancelled' });
  } catch (error) {
    console.error('removeFriend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { userId },
          { friendId: userId }
        ]
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, level: true, xp: true, lastLoginAt: true } },
        friend: { select: { id: true, username: true, avatarUrl: true, level: true, xp: true, lastLoginAt: true } }
      }
    });

    const friends = friendships.map(f => {
      const friendData = f.userId === userId ? f.friend : f.user;
      return {
        friendshipId: f.id,
        ...friendData
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('getFriends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending'
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, level: true, xp: true } }
      }
    });

    res.json(requests.map(r => ({
      friendshipId: r.id,
      sender: r.user,
      createdAt: r.createdAt
    })));
  } catch (error) {
    console.error('getPendingRequests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' },
        id: { not: req.user.userId }
      },
      select: { id: true, username: true, avatarUrl: true, level: true },
      take: 10
    });

    // Find if friendship exists
    const userIds = users.map(u => u.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: req.user.userId, friendId: { in: userIds } },
          { userId: { in: userIds }, friendId: req.user.userId }
        ]
      }
    });

    const results = users.map(u => {
      const f = friendships.find(f => f.userId === u.id || f.friendId === u.id);
      return {
        ...u,
        friendshipStatus: f ? f.status : null,
        friendshipId: f ? f.id : null,
        isSender: f ? f.userId === req.user.userId : false
      };
    });

    res.json(results);
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};
