const express = require('express');
const {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/request', protect, sendFriendRequest);
router.get('/requests/received', protect, getReceivedRequests);
router.get('/requests/sent', protect, getSentRequests);
router.put('/request/:requestId/accept', protect, acceptFriendRequest);
router.put('/request/:requestId/reject', protect, rejectFriendRequest);
router.delete('/:friendId', protect, removeFriend);

module.exports = router;
