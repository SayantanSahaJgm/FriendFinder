const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Update location
router.put('/location', auth, userController.updateLocation);

// Update max distance
router.put('/max-distance', auth, userController.updateMaxDistance);

// Find nearby users
router.get('/nearby', auth, userController.findNearbyUsers);

// Get user by ID
router.get('/:userId', auth, userController.getUserById);

module.exports = router;
