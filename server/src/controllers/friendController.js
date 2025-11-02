const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

// Send friend request
const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId },
        { sender: receiverId, receiver: req.user._id },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    const friendRequest = await FriendRequest.create({
      sender: req.user._id,
      receiver: receiverId,
    });

    await friendRequest.populate('sender receiver', 'name email avatar');

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get received friend requests
const getReceivedRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending',
    }).populate('sender', 'name email avatar isOnline');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get sent friend requests
const getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user._id,
      status: 'pending',
    }).populate('receiver', 'name email avatar isOnline');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept friend request
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Add to friends list
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.receiver },
    });

    await User.findByIdAndUpdate(friendRequest.receiver, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject friend request
const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove friend
const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.user._id },
    });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
};
