const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const passwordHash = await bcrypt.hash(password || 'Welcome123!', 12);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, displayName, role: role||'employee', orgId: req.user.orgId });
    res.status(201).json({ ...user.toObject(), passwordHash: undefined });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const { displayName, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { displayName, role, isActive }, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireRole('admin','super_admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
