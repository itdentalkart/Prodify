const router = require('express').Router();
const { Session } = require('../models');
const { authMiddleware } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { deviceId, limit = 20 } = req.query;
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    const sessions = await Session.find(filter).populate('deviceId','hostname').sort({ sessionStart: -1 }).limit(parseInt(limit));
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
