const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

router.use(auth);

// Get user statistics
router.get('/user', statsController.getUserStats);

// Get habit-specific statistics
router.get('/habit/:habitId', statsController.getHabitStats);

module.exports = router;