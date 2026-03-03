// ─── routes/users.js ─────────────────────────────────────────────────────────
const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const usersRouter = express.Router();
usersRouter.use(authMiddleware);

usersRouter.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

usersRouter.post('/', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const passwordHash = await bcrypt.hash(password || 'Welcome123!', 12);
    const user = await User.create({
      email: email.toLowerCase(), passwordHash, displayName,
      role: role || 'employee', orgId: req.user.orgId,
    });
    res.status(201).json({ ...user.toObject(), passwordHash: undefined });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

usersRouter.patch('/:id', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { displayName, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, { displayName, role, isActive }, { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

usersRouter.delete('/:id', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── routes/organizations.js ──────────────────────────────────────────────────
const orgsRouter = express.Router();
const { Organization } = require('../models');
orgsRouter.use(authMiddleware);

orgsRouter.get('/', async (req, res) => {
  try {
    if (req.user.role === 'super_admin') {
      const orgs = await Organization.find().sort({ createdAt: -1 });
      return res.json(orgs);
    }
    const org = await Organization.findById(req.user.orgId);
    res.json(org ? [org] : []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

orgsRouter.patch('/:id', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, domain, screenshotIntervalSec, idleThresholdSec, workingHours, retentionDays } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { name, domain, screenshotIntervalSec, idleThresholdSec, workingHours, retentionDays },
      { new: true }
    );
    res.json(org);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── routes/screenshots.js ────────────────────────────────────────────────────
const screenshotsRouter = express.Router();
const { Screenshot } = require('../models');
screenshotsRouter.use(authMiddleware);

screenshotsRouter.get('/', async (req, res) => {
  try {
    const { deviceId, from, to, limit = 50 } = req.query;
    const filter = { orgId: req.user.orgId };
    if (deviceId) filter.deviceId = deviceId;
    if (from || to) {
      filter.capturedAt = {};
      if (from) filter.capturedAt.$gte = new Date(from);
      if (to)   filter.capturedAt.$lte = new Date(to);
    }
    const screenshots = await Screenshot.find(filter)
      .sort({ capturedAt: -1 })
      .limit(parseInt(limit));

    const baseUrl = process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const result = screenshots.map(s => ({
      ...s.toObject(),
      url: `${baseUrl}/screenshots/${s.filePath}`,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── routes/sessions.js ───────────────────────────────────────────────────────
const sessionsRouter = express.Router();
const { Session } = require('../models');
sessionsRouter.use(authMiddleware);

sessionsRouter.get('/', async (req, res) => {
  try {
    const { deviceId, limit = 20 } = req.query;
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    const sessions = await Session.find(filter)
      .populate('deviceId', 'hostname')
      .sort({ sessionStart: -1 })
      .limit(parseInt(limit));
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── routes/telemetry.js ──────────────────────────────────────────────────────
const telemetryRouter = express.Router();
const { TelemetryEvent } = require('../models');
telemetryRouter.use(authMiddleware);

telemetryRouter.get('/', async (req, res) => {
  try {
    const { deviceId, eventType, limit = 50 } = req.query;
    const filter = { orgId: req.user.orgId };
    if (deviceId)  filter.deviceId  = deviceId;
    if (eventType) filter.eventType = eventType;
    const events = await TelemetryEvent.find(filter)
      .populate('deviceId', 'hostname')
      .sort({ eventTime: -1 })
      .limit(parseInt(limit));
    res.json(events);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── routes/auditLogs.js ──────────────────────────────────────────────────────
const auditRouter = express.Router();
const { AuditLog } = require('../models');
auditRouter.use(authMiddleware);

auditRouter.get('/', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const logs = await AuditLog.find(filter)
      .populate('userId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── routes/licenses.js ───────────────────────────────────────────────────────
const licensesRouter = express.Router();
const { License } = require('../models');
licensesRouter.use(authMiddleware);

licensesRouter.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const licenses = await License.find(filter).populate('orgId', 'name');
    res.json(licenses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

licensesRouter.patch('/:orgId', requireRole('super_admin'), async (req, res) => {
  try {
    const { totalLicenses, status, expiresAt } = req.body;
    const license = await License.findOneAndUpdate(
      { orgId: req.params.orgId },
      { totalLicenses, status, expiresAt },
      { new: true, upsert: true }
    );
    res.json(license);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── routes/dashboard.js ─────────────────────────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get('/', async (req, res) => {
  try {
    const { Device, Screenshot, TelemetryEvent, Session } = require('../models');
    const orgId = req.user.orgId;

    const [totalDevices, onlineDevices, idleDevices, offlineDevices, todayScreenshots, recentEvents] =
      await Promise.all([
        Device.countDocuments({ orgId }),
        Device.countDocuments({ orgId, status: 'online' }),
        Device.countDocuments({ orgId, status: 'idle' }),
        Device.countDocuments({ orgId, status: 'offline' }),
        Screenshot.countDocuments({
          orgId,
          capturedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        }),
        TelemetryEvent.find({ orgId })
          .populate('deviceId', 'hostname')
          .sort({ eventTime: -1 })
          .limit(10),
      ]);

    res.json({
      totalDevices,
      onlineDevices,
      idleDevices,
      offlineDevices,
      todayScreenshots,
      recentEvents,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = {
  usersRouter,
  orgsRouter,
  screenshotsRouter,
  sessionsRouter,
  telemetryRouter,
  auditRouter,
  licensesRouter,
  dashboardRouter,
};
