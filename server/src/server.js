const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDB, closeDB } = require('./db/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/time-entries', require('./routes/timeEntries'));
app.use('/api/stats', require('./routes/stats'));

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;

// Store server instance
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    closeDB();
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    closeDB();
    process.exit(0);
  });
});