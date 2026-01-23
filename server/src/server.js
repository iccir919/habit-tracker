const express = require('express');
const cors = require('cors');
const { createTables, createIndexes } = require('./db/schema');
const { closeDB } = require('./db/database');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
try {
    createTables();
    createIndexes();
    console.log('Database initialized');
} catch (err) {
    console.error('Database initialization error:', err);
    process.exit(1);
}

app.get('/', (req, res) => {
    res.json({ message: 'Habit Tracker API', version: '1.0.0' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})

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