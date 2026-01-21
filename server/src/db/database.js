const Database = require('better-sqlite3');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './habit-tracker.db';
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function getDB() {
    return db;
}

function closeDB() {
    db.close();
    console.log('Database connection closed.');
}

module.exports = { getDB, closeDB };