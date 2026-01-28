const express = require('express');
const router = express.Router();
const timeEntryController = require('../controllers/timeEntryController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get time entries for a log
router.get('/log/:logId', timeEntryController.getTimeEntries);

// Add time entry
router.post('/habit/:habitId/date/:date', timeEntryController.addTimeEntry);

// Delete a time entry
router.delete('/:entryId', timeEntryController.deleteTimeEntry);

module.exports = router;