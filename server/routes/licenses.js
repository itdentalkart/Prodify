const router = require('express').Router();
const { License } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    res.json(await License.find(filter).populate('orgId','name'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:orgId', requireRole('super_admin'), async (req, res) => {
  try {
    const license = await License.findOneAndUpdate(
      { orgId: req.params.orgId }, req.body, { new: true, upsert: true }
    );
    res.json(license);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
