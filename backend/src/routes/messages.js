const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

// Send a message
router.post('/', auth, messageController.sendMessage);

// Get chat history with a specific user
router.get('/chat/:userId', auth, messageController.getChatHistory);

// Mark messages as read
router.put('/read/:senderId', auth, messageController.markAsRead);

module.exports = router;
