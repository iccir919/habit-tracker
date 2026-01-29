const Database = require('better-sqlite3');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './habit-tracker.db';
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDB() {
    console.log('Database initialized:', dbPath);
    createTables(db);
    createIndexes(db);
}

function getDB() {
    return db;
}

function closeDB() {
    db.close();
    console.log('Database connection closed.');
}

const { createTables, createIndexes } = require('./schema');

module.exports = { initDB, getDB, closeDB };