const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Device, EnrollmentToken, License, AuditLog, TelemetryEvent } = require('../models');

// POST /agent-enroll
// Called by Windows C# agent during first setup
router.post('/', async (req, res) => {
  try {
    const { enroll_token, hostname, os, device_type, ip_address, agent_version } = req.body;

    if (!enroll_token || !hostname) {
      return res.status(400).json({ error: 'enroll_token and hostname are required' });
    }

    // Verify enrollment token
    const tokenData = await EnrollmentToken.findOne({
      token: enroll_token,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired enrollment token' });
    }

    // Check license availability
    const license = await License.findOne({ orgId: tokenData.orgId });
    if (!license || license.usedLicenses >= license.totalLicenses) {
      return res.status(403).json({
        error: 'No available device licenses. Contact your administrator.',
      });
    }

    // Generate unique agent token
    const agentToken = uuidv4() + '-' + uuidv4();

    // Create device
    const device = await Device.create({
      orgId: tokenData.orgId,
      hostname,
      os,
      deviceType: device_type || 'Desktop',
      ipAddress: ip_address || req.ip,
      agentVersion: agent_version,
      agentToken,
      status: 'online',
      lastSeen: new Date(),
    });

    // Mark token as used
    tokenData.usedAt = new Date();
    tokenData.usedByDeviceId = device._id;
    await tokenData.save();

    // Increment used licenses
    license.usedLicenses += 1;
    await license.save();

    // Audit log
    await AuditLog.create({
      orgId: tokenData.orgId,
      userId: tokenData.createdBy,
      action: 'DEVICE_ENROLLED',
      resourceType: 'device',
      resourceId: device._id.toString(),
      details: { hostname, os, device_type },
    });

    console.log(`✅ Device enrolled: ${hostname} (${device._id})`);

    res.json({
      success: true,
      device_id: device._id,
      agent_token: agentToken,
      config: {
        screenshot_interval_sec: 300,
        heartbeat_interval_sec: 300,
        idle_threshold_sec: 300,
      },
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

module.exports = router;
