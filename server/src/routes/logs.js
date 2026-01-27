const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get daily summary (all habits + logs for a date)
router.get('/daily', logController.getDailySummary);

// Get logs by date
router.get('/', logController.getLogsByDate);

// Get logs for a specific habit
router.get('/habit/:habitId', logController.getHabitLogs);

// Create or update a log
router.post('/habit/:habitId', [
    body('date').notEmpty().withMessage('Date is required'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
    body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
    body('notes').optional().isString().withMessage('Notes must be a string')
], logController.upsertLog);

// Delete a log
router.delete('/habit/:habitId', logController.deleteLog);

module.exports = router;