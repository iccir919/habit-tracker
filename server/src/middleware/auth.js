const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();

    const result = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = auth;