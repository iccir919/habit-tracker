const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');

function auth(req, res, next) {
    try {
        const token = req.headers['authorization']?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = getDB();

        const user = db.prepare(`
            SELECT id, name, created_at
            FROM users WHERE id = ?
        `).get(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
}

module.exports = auth;