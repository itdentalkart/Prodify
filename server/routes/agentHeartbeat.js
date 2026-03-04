const express = require('express');
const router = express.Router();
const { Device } = require('../models');
const { agentAuthMiddleware } = require('../middleware/auth');

router.post('/', agentAuthMiddleware, async (req, res) => {
  try {
    const { status, ipAddress, agentVersion, os } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.device._id,
      { status: status || 'online', lastSeen: new Date(), ipAddress, agentVersion, os },
      { new: true }
    );

    // Broadcast to SSE clients
    if (req.app.locals.sseClients) {
      const event = JSON.stringify({ type: 'heartbeat', device: { _id: device._id, hostname: device.hostname, status: device.status, lastSeen: device.lastSeen } });
      req.app.locals.sseClients.forEach(client => client.res.write(`data: ${event}\n\n`));
    }

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
