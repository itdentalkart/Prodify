const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { Device, Screenshot, TelemetryEvent } = require('../models');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const [total, online, idle, offline, todayScreenshots, recentEvents] = await Promise.all([
      Device.countDocuments({ orgId }),
      Device.countDocuments({ orgId, status: 'online' }),
      Device.countDocuments({ orgId, status: 'idle' }),
      Device.countDocuments({ orgId, status: 'offline' }),
      Screenshot.countDocuments({ orgId, capturedAt: { $gte: todayStart } }),
      TelemetryEvent.find({ orgId }).populate('deviceId','hostname').sort({ eventTime: -1 }).limit(10),
    ]);
    res.json({ totalDevices: total, onlineDevices: online, idleDevices: idle, offlineDevices: offline, todayScreenshots, recentEvents });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
