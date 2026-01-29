async function createTables(db) {
  if (!db) {
    const { getDB } = require('./database');
    db = getDB();
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      timezone TEXT DEFAULT 'UTC',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      tracking_type TEXT NOT NULL CHECK(tracking_type IN ('completion', 'duration')),
      target_duration INTEGER,
      target_days TEXT,
      category TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      completed BOOLEAN DEFAULT false,
      duration INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id SERIAL PRIMARY KEY,
      habit_log_id INTEGER NOT NULL REFERENCES habit_logs(id) ON DELETE CASCADE,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables created successfully');
}

async function createIndexes(db) {
  if (!db) {
    const { getDB } = require('./database');
    db = getDB();
  }

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_habit_id ON habit_logs(habit_id);
    CREATE INDEX IF NOT EXISTS idx_logs_date ON habit_logs(date);
    CREATE INDEX IF NOT EXISTS idx_time_entries_log_id ON time_entries(habit_log_id);
  `);

  console.log('Indexes created successfully');
}

module.exports = { createTables, createIndexes };