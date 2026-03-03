const router = require('express').Router();
const { TelemetryEvent, Session, Device } = require('../models');
const { agentAuthMiddleware } = require('../middleware/auth');

// POST /agent-events
router.post('/', agentAuthMiddleware, async (req, res) => {
  try {
    const { event_type, event_time, details } = req.body;
    const device = req.device;

    if (!event_type) return res.status(400).json({ error: 'event_type required' });

    await TelemetryEvent.create({
      deviceId:  device._id,
      orgId:     device.orgId,
      eventType: event_type,
      eventTime: event_time ? new Date(event_time) : new Date(),
      details:   details || {},
    });

    // Handle session lifecycle events
    if (event_type === 'session_start') {
      await Session.create({
        deviceId:     device._id,
        sessionStart: new Date(),
      });
    } else if (event_type === 'session_end' && details?.session_id) {
      // Update device status to offline
      await Device.findByIdAndUpdate(device._id, { status: 'offline' });
    } else if (event_type === 'idle_start') {
      await Device.findByIdAndUpdate(device._id, { status: 'idle' });
    } else if (event_type === 'idle_end') {
      await Device.findByIdAndUpdate(device._id, { status: 'online' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Events error:', err);
    res.status(500).json({ error: 'Event processing failed' });
  }
});

module.exports = router;
