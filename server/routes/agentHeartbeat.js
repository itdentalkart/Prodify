const router = require('express').Router();
const { Device, TelemetryEvent } = require('../models');
const { agentAuthMiddleware } = require('../middleware/auth');

// POST /agent-heartbeat
router.post('/', agentAuthMiddleware, async (req, res) => {
  try {
    const { agent_version, os_version, hostname } = req.body;
    const device = req.device;

    // Update device
    await Device.findByIdAndUpdate(device._id, {
      lastSeen: new Date(),
      status: 'online',
      ...(agent_version && { agentVersion: agent_version }),
      ...(os_version    && { os: os_version }),
      ...(hostname      && { hostname }),
    });

    // Log telemetry
    await TelemetryEvent.create({
      deviceId:  device._id,
      orgId:     device.orgId,
      eventType: 'heartbeat',
      eventTime: new Date(),
      details:   req.body,
    });

    res.json({ success: true, server_time: new Date().toISOString() });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

module.exports = router;
