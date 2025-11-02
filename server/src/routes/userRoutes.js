const express = require('express');
const {
  updateLocation,
  updateProfile,
  findNearbyUsers,
  getUserById,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.put('/location', protect, updateLocation);
router.put('/profile', protect, updateProfile);
router.get('/nearby', protect, findNearbyUsers);
router.get('/:id', protect, getUserById);

module.exports = router;
