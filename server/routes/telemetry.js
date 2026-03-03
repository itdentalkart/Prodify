const router = require('express').Router();
const { TelemetryEvent } = require('../models');
const { authMiddleware } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { deviceId, eventType, limit = 50 } = req.query;
    const filter = { orgId: req.user.orgId };
    if (deviceId)  filter.deviceId  = deviceId;
    if (eventType) filter.eventType = eventType;
    const events = await TelemetryEvent.find(filter).populate('deviceId','hostname').sort({ eventTime: -1 }).limit(parseInt(limit));
    res.json(events);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
