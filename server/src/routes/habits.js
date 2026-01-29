const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const habitController = require('../controllers/habitController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all habits for user
router.get('/', habitController.getHabits);

// Get single habit
router.get('/:id', habitController.getHabit);

// Create new habit
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('trackingType').isIn(['completion', 'duration']).withMessage('Invalid tracking type'),
  body('targetDuration')
    .if(body('trackingType').equals('duration'))
    .isInt({ min: 1 })
    .withMessage('Target duration must be positive'),
  body('targetDays').optional().isArray().withMessage('Target days must be an array'),
  body('category').optional().trim(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('icon').optional().trim()
], habitController.createHabit);

// Update habit
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('trackingType').optional().isIn(['completion', 'duration']).withMessage('Invalid tracking type'),
  body('targetDuration')
    .if(body('trackingType').equals('duration'))
    .isInt({ min: 1 })
    .withMessage('Target duration must be positive'),
  body('targetDays').optional().isArray().withMessage('Target days must be an array'),
  body('category').optional().trim(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('icon').optional().trim()
], habitController.updateHabit);

// Delete habit
router.delete('/:id', habitController.deleteHabit);

module.exports = router;