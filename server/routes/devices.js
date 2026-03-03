// ─── routes/devices.js ────────────────────────────────────────────────────────
const router = require('express').Router();
const { Device, AuditLog, License } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/devices — list all devices for org
router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const devices = await Device.find(filter)
      .populate('assignedUserId', 'displayName email')
      .sort({ lastSeen: -1 });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/devices/:id
router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('assignedUserId', 'displayName email');
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/devices/:id
router.patch('/:id', requireRole('admin', 'it', 'super_admin'), async (req, res) => {
  try {
    const { assignedUserId, location, deviceType } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { assignedUserId, location, deviceType },
      { new: true }
    );
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/devices/:id
router.delete('/:id', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    // Decrement license count
    await License.findOneAndUpdate(
      { orgId: device.orgId },
      { $inc: { usedLicenses: -1 } }
    );

    await AuditLog.create({
      orgId: device.orgId,
      userId: req.user._id,
      action: 'DEVICE_DELETED',
      resourceType: 'device',
      resourceId: device._id.toString(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
