const Message = require('../models/Message');
const User = require('../models/User');

// Get chat messages between two users
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender receiver', 'name avatar');

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    // Check if receiver is a friend
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.friends.includes(receiverId)) {
      return res.status(403).json({ message: 'Can only message friends' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
    });

    await message.populate('sender receiver', 'name avatar');

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
        read: false,
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
};
