const User = require('../models/User');

// Update user location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    ).select('-password');

    res.json({ message: 'Location updated successfully', user });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Server error updating location' });
  }
};

// Update max distance filter
exports.updateMaxDistance = async (req, res) => {
  try {
    const { maxDistance } = req.body;

    if (!maxDistance || maxDistance < 0) {
      return res.status(400).json({ error: 'Valid max distance is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { maxDistance },
      { new: true }
    ).select('-password');

    res.json({ message: 'Max distance updated successfully', user });
  } catch (error) {
    console.error('Update max distance error:', error);
    res.status(500).json({ error: 'Server error updating max distance' });
  }
};

// Find nearby users based on location and max distance
exports.findNearbyUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);

    if (!currentUser.location.coordinates[0] && !currentUser.location.coordinates[1]) {
      return res.status(400).json({ error: 'Please update your location first' });
    }

    const nearbyUsers = await User.find({
      _id: { $ne: req.userId },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: currentUser.location.coordinates,
          },
          $maxDistance: currentUser.maxDistance,
        },
      },
    })
      .select('name email location profilePicture isOnline')
      .limit(50);

    res.json({ users: nearbyUsers });
  } catch (error) {
    console.error('Find nearby users error:', error);
    res.status(500).json({ error: 'Server error finding nearby users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -socketId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Server error fetching user' });
  }
};
