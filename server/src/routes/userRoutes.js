const express = require('express');
const {
  updateLocation,
  updateProfile,
  findNearbyUsers,
  getUserById,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { locationValidation, profileValidation } = require('../middleware/validation');

const router = express.Router();

router.put('/location', apiLimiter, protect, locationValidation, updateLocation);
router.put('/profile', apiLimiter, protect, profileValidation, updateProfile);
router.get('/nearby', apiLimiter, protect, findNearbyUsers);
router.get('/:id', apiLimiter, protect, getUserById);

module.exports = router;
