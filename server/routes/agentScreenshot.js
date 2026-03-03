const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Screenshot, Device } = require('../models');
const { agentAuthMiddleware } = require('../middleware/auth');

// ─── Multer Storage Config ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const device = req.device;
    const dir = path.join(
      __dirname, '../uploads/screenshots',
      device.orgId.toString(),
      device._id.toString()
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    cb(null, `${ts}.jpg`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_SCREENSHOT_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// POST /agent-screenshot
router.post('/', agentAuthMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Screenshot file required' });

    const { timestamp, session_id, hash } = req.body;
    const device = req.device;

    // Deduplication: skip if same hash already stored
    if (hash) {
      const duplicate = await Screenshot.findOne({ deviceId: device._id, hash });
      if (duplicate) {
        fs.unlinkSync(req.file.path); // remove duplicate file
        return res.json({ success: true, duplicate: true });
      }
    }

    // Relative path for serving
    const relativePath = path.relative(
      path.join(__dirname, '../uploads'),
      req.file.path
    ).replace(/\\/g, '/');

    const screenshot = await Screenshot.create({
      deviceId:   device._id,
      orgId:      device.orgId,
      sessionId:  session_id || null,
      filePath:   relativePath,
      fileSize:   req.file.size,
      capturedAt: timestamp ? new Date(timestamp) : new Date(),
      hash:       hash || null,
    });

    res.json({ success: true, screenshot_id: screenshot._id });
  } catch (err) {
    console.error('Screenshot error:', err);
    res.status(500).json({ error: 'Screenshot upload failed' });
  }
});

module.exports = router;
