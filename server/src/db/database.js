const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

async function initDB() {
  try {
    await createTables();
    await createIndexes();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

function getDB() {
  return pool;
}

async function closeDB() {
  await pool.end();
  console.log('Database connection closed');
}

// Import after pool is defined
const { createTables, createIndexes } = require('./schema');

module.exports = { initDB, getDB, closeDB };