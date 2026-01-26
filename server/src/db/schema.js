const { getDB } = require('./database');

function createTables() {
    const db = getDB();

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            tracking_type TEXT NOT NULL CHECK(tracking_type IN ('completion', 'duration')),
            target_duration INTEGER,
            frequency TEXT DEFAULT 'daily' CHECK(frequency IN ('daily', 'weekly', 'monthly')),
            target_days TEXT, -- JSON array stored as text
            target_count INTEGER,
            category TEXT,
            color TEXT DEFAULT '#3b82f6',
            icon TEXT,
            active BOOLEAN DEFAULT 1,
            archived BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS habit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            habit_id INTEGER NOT NULL,
            date DATE NOT NULL,
            completed BOOLEAN DEFAULT 0,
            duration INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
            UNIQUE(habit_id, date)
        );
    `);
    console.log('Tables created successfully');
}

function createIndexes() {
    const db = getDB();

    db.exec(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
            CREATE INDEX IF NOT EXISTS idx_logs_habit_id ON habit_logs(habit_id);
            CREATE INDEX IF NOT EXISTS idx_logs_date ON habit_logs(date);        
    `)

    console.log('Indexes created successfully');
}

module.exports = { createTables, createIndexes };