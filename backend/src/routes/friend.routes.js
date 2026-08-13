const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/request', requireAuth, friendController.sendFriendRequest);
router.post('/accept/:id', requireAuth, friendController.acceptFriendRequest);
router.delete('/:id', requireAuth, friendController.removeFriend);
router.get('/', requireAuth, friendController.getFriends);
router.get('/pending', requireAuth, friendController.getPendingRequests);
router.get('/search', requireAuth, friendController.searchUsers);

module.exports = router;
