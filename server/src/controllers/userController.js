const User = require('../models/User');

// Update user location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        address: address || '',
      },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar, maxDistance } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (maxDistance) updateData.maxDistance = maxDistance;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Find nearby users
const findNearbyUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser.location || !currentUser.location.coordinates) {
      return res.status(400).json({ message: 'Location not set' });
    }

    const maxDistance = currentUser.maxDistance || 10000;

    const nearbyUsers = await User.find({
      _id: { $ne: req.user._id, $nin: currentUser.friends },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: currentUser.location.coordinates,
          },
          $maxDistance: maxDistance,
        },
      },
    }).select('name email avatar bio location address isOnline');

    res.json(nearbyUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar bio location address isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  updateLocation,
  updateProfile,
  findNearbyUsers,
  getUserById,
};
