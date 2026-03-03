const router = require('express').Router();
const { Organization } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'super_admin') {
      return res.json(await Organization.find().sort({ createdAt: -1 }));
    }
    const org = await Organization.findById(req.user.orgId);
    res.json(org ? [org] : []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(org);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
