const router = require('express').Router();
const crypto = require('crypto');
const { EnrollmentToken } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/enrollment — list tokens for org
router.get('/', async (req, res) => {
  try {
    const tokens = await EnrollmentToken.find({ orgId: req.user.orgId })
      .populate('createdBy', 'displayName email')
      .sort({ createdAt: -1 });
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enrollment — create new token
router.post('/', requireRole('admin', 'it', 'super_admin'), async (req, res) => {
  try {
    const { label, expiresInHours = 24 } = req.body;
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const enrollment = await EnrollmentToken.create({
      token,
      orgId: req.user.orgId,
      createdBy: req.user._id,
      expiresAt,
      label,
    });

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/enrollment/:id
router.delete('/:id', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    await EnrollmentToken.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
