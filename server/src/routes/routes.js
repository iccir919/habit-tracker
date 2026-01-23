const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const habitController = require('../controllers/habitController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create habit
router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('trackingType').isIn(['completion', 'duration']).withMessage('Invalid tracking type'),
    body('targetDuration')
        .if(body('trackingType').equals('duration'))
        .isInt({ min: 1 }).withMessage('Target duration must be at least 1 minute')
], habitController.createHabit);

// Get all habits
router.get('/', habitController.getHabits);

// Get single habit
router.get('/:id', habitController.getHabit);

// Update habit
router.put('/:id', habitController.updateHabit);

// Delete habit
router.delete('/:id', habitController.deleteHabit);

module.exports = router;


