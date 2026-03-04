const express = require('express');
const router = express.Router();
const { Device, EnrollmentToken, Organization } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function handleEnroll(req, res) {
  try {
    const { enrollToken, hostname, os, agentVersion, deviceType, ipAddress } = req.body;
    if (!enrollToken) return res.status(400).json({ error: 'enrollToken required' });

    const tokenDoc = await EnrollmentToken.findOne({ token: enrollToken, usedAt: null });
    if (!tokenDoc) return res.status(401).json({ error: 'Invalid or already used token' });
    if (new Date() > tokenDoc.expiresAt) return res.status(401).json({ error: 'Token expired' });

    const agentToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');

    let device = await Device.findOne({ hostname, orgId: tokenDoc.orgId });
    if (!device) {
      device = await Device.create({
        orgId: tokenDoc.orgId, hostname, os, agentVersion,
        deviceType: deviceType || 'Desktop',
        ipAddress, agentToken, status: 'online', lastSeen: new Date(),
      });
    } else {
      device.agentToken = agentToken;
      device.status = 'online';
      device.lastSeen = new Date();
      device.os = os || device.os;
      device.agentVersion = agentVersion || device.agentVersion;
      await device.save();
    }

    await EnrollmentToken.findByIdAndUpdate(tokenDoc._id, {
      usedAt: new Date(), usedByDeviceId: device._id
    });

    // Broadcast to SSE clients
    if (req.app.locals.sseClients) {
      const event = JSON.stringify({ type: 'device_enrolled', device: { _id: device._id, hostname, status: 'online', lastSeen: device.lastSeen } });
      req.app.locals.sseClients.forEach(client => client.res.write(`data: ${event}\n\n`));
    }

    console.log(`✅ Device enrolled: ${hostname} (org: ${tokenDoc.orgId})`);
    res.json({ agentToken, deviceId: device._id.toString(), orgId: tokenDoc.orgId.toString() });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ error: err.message });
  }
}

router.post('/', handleEnroll);
module.exports = router;
