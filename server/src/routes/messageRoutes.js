const express = require('express');
const {
  getMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');
const { messageValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/:userId', apiLimiter, protect, getMessages);
router.post('/', strictLimiter, protect, messageValidation, sendMessage);
router.put('/:userId/read', apiLimiter, protect, markAsRead);

module.exports = router;
