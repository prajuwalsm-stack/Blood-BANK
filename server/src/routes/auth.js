const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

// Public registration always creates a normal user. Admin accounts must be created securely by an existing administrator.
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, valid email and password (at least 8 characters) are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [String(fullName).trim(), cleanEmail, passwordHash, 'user']
    );
    const user = { id: result.insertId, full_name: String(fullName).trim(), email: cleanEmail, role: 'user' };
    res.status(201).json({
      message: 'Registration successful.',
      token: createToken(user),
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const [rows] = await db.execute(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [String(email).trim().toLowerCase()]
    );
    if (!rows.length) return res.status(401).json({ message: 'Incorrect email or password.' });

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) return res.status(401).json({ message: 'Incorrect email or password.' });

    res.json({
      message: 'Login successful.',
      token: createToken(user),
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

const { authenticateToken } = require('../middleware/auth');
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, full_name AS fullName, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User account not found.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

module.exports = router;
