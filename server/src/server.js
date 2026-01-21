const express = require('express');
const cors = require('cors');
const { createTables, createIndexes } = require('./db/schema');
const { closeDB } = require('./db/database');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

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