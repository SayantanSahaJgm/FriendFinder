const express = require('express');
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/request', auth, friendController.sendFriendRequest);

// Get pending friend requests
router.get('/requests/pending', auth, friendController.getPendingRequests);

// Accept friend request
router.put('/request/:requestId/accept', auth, friendController.acceptFriendRequest);

// Reject friend request
router.put('/request/:requestId/reject', auth, friendController.rejectFriendRequest);

// Get friends list
router.get('/', auth, friendController.getFriends);

module.exports = router;
