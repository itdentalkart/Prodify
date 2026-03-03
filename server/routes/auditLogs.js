const router = require('express').Router();
const { AuditLog } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const logs = await AuditLog.find(filter).populate('userId','displayName email').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
