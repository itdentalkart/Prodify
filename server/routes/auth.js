const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Organization, License, AuditLog } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// ─── Register (company signup) ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, companyName } = req.body;

    if (!email || !password || !companyName) {
      return res.status(400).json({ error: 'email, password, companyName required' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Create organization
    const org = await Organization.create({ name: companyName });

    // Create license record (0 licenses until super_admin assigns)
    await License.create({ orgId: org._id, totalLicenses: 0 });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      displayName: displayName || email.split('@')[0],
      orgId: org._id,
      role: 'admin',
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, orgId: org._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        orgId: user.orgId,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ error: 'Account disabled' });

    const token = jwt.sign(
      { userId: user._id, role: user.role, orgId: user.orgId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        orgId: user.orgId,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      displayName: req.user.displayName,
      role: req.user.role,
      orgId: req.user.orgId,
    },
  });
});

// ─── Change password ──────────────────────────────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
