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
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');
const { friendRequestValidation } = require('../middleware/validation');

const router = express.Router();

router.post('/request', strictLimiter, protect, friendRequestValidation, sendFriendRequest);
router.get('/requests/received', apiLimiter, protect, getReceivedRequests);
router.get('/requests/sent', apiLimiter, protect, getSentRequests);
router.put('/request/:requestId/accept', strictLimiter, protect, acceptFriendRequest);
router.put('/request/:requestId/reject', strictLimiter, protect, rejectFriendRequest);
router.delete('/:friendId', strictLimiter, protect, removeFriend);

module.exports = router;
