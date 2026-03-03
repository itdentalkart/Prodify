const router = require('express').Router();
const { Screenshot } = require('../models');
const { authMiddleware } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { deviceId, from, to, limit = 50 } = req.query;
    const filter = { orgId: req.user.orgId };
    if (deviceId) filter.deviceId = deviceId;
    if (from || to) {
      filter.capturedAt = {};
      if (from) filter.capturedAt.$gte = new Date(from);
      if (to)   filter.capturedAt.$lte = new Date(to);
    }
    const screenshots = await Screenshot.find(filter).sort({ capturedAt: -1 }).limit(parseInt(limit));
    const baseUrl = process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT||3000}`;
    res.json(screenshots.map(s => ({ ...s.toObject(), url: `${baseUrl}/screenshots/${s.filePath}` })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
