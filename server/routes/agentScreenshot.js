const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Screenshot, Device } = require('../models');
const { agentAuthMiddleware } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/screenshots');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${req.device._id}.jpg`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', agentAuthMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No screenshot file' });
    const device = req.device;
    const baseUrl = process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const filePath = req.file.filename;

    const screenshot = await Screenshot.create({
      deviceId: device._id,
      orgId: device.orgId,
      filePath,
      fileSize: req.file.size,
      capturedAt: req.body.capturedAt ? new Date(req.body.capturedAt) : new Date(),
    });

    await Device.findByIdAndUpdate(device._id, { lastSeen: new Date(), status: 'online' });

    // Broadcast to SSE clients
    if (req.app.locals.sseClients) {
      const event = JSON.stringify({
        type: 'screenshot',
        screenshot: {
          _id: screenshot._id,
          deviceId: device._id,
          hostname: device.hostname,
          url: `${baseUrl}/screenshots/${filePath}`,
          capturedAt: screenshot.capturedAt,
        }
      });
      req.app.locals.sseClients.forEach(client => {
        if (client.orgId.toString() === device.orgId.toString()) {
          client.res.write(`data: ${event}\n\n`);
        }
      });
    }

    res.json({ ok: true, screenshotId: screenshot._id });
  } catch (err) {
    console.error('Screenshot error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
