#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Run this on your Ubuntu server from ~/project/
# Command: bash setup-server.sh
# ═══════════════════════════════════════════════════════════════

set -e
cd ~/project

echo "📁 Creating missing files..."

# ─── models/index.js ──────────────────────────────────────────
cat > server/models/index.js << 'ENDOFFILE'
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrganizationSchema = new Schema({
  name:                  { type: String, required: true },
  domain:                { type: String },
  screenshotIntervalSec: { type: Number, default: 300 },
  idleThresholdSec:      { type: Number, default: 300 },
  workingHours:          { type: String, default: '09:00-18:00' },
  retentionDays:         { type: Number, default: 30 },
}, { timestamps: true });

const UserSchema = new Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  displayName:  { type: String },
  orgId:        { type: Schema.Types.ObjectId, ref: 'Organization' },
  role:         { type: String, enum: ['super_admin','admin','it','employee'], default: 'employee' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

const DeviceSchema = new Schema({
  orgId:          { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  hostname:       { type: String, required: true },
  deviceType:     { type: String, default: 'Desktop' },
  os:             { type: String },
  ipAddress:      { type: String },
  agentVersion:   { type: String },
  agentToken:     { type: String, unique: true, sparse: true },
  lastSeen:       { type: Date },
  status:         { type: String, enum: ['online','idle','offline'], default: 'offline' },
  location:       { type: String },
  assignedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const SessionSchema = new Schema({
  deviceId:     { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  userId:       { type: Schema.Types.ObjectId, ref: 'User' },
  sessionStart: { type: Date, default: Date.now },
  sessionEnd:   { type: Date },
  activeSeconds:{ type: Number, default: 0 },
  idleSeconds:  { type: Number, default: 0 },
}, { timestamps: true });

const ScreenshotSchema = new Schema({
  deviceId:   { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  orgId:      { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  sessionId:  { type: Schema.Types.ObjectId, ref: 'Session' },
  filePath:   { type: String, required: true },
  fileSize:   { type: Number },
  capturedAt: { type: Date, default: Date.now },
  hash:       { type: String },
}, { timestamps: true });

const TelemetryEventSchema = new Schema({
  deviceId:  { type: Schema.Types.ObjectId, ref: 'Device' },
  orgId:     { type: Schema.Types.ObjectId, ref: 'Organization' },
  eventType: { type: String, required: true },
  eventTime: { type: Date, default: Date.now },
  details:   { type: Schema.Types.Mixed },
}, { timestamps: true });

const EnrollmentTokenSchema = new Schema({
  token:          { type: String, required: true, unique: true },
  orgId:          { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  expiresAt:      { type: Date, required: true },
  usedAt:         { type: Date },
  usedByDeviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
  label:          { type: String },
}, { timestamps: true });

const LicenseSchema = new Schema({
  orgId:         { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  totalLicenses: { type: Number, default: 0 },
  usedLicenses:  { type: Number, default: 0 },
  status:        { type: String, enum: ['active','suspended','expired'], default: 'active' },
  expiresAt:     { type: Date },
}, { timestamps: true });

const AuditLogSchema = new Schema({
  orgId:        { type: Schema.Types.ObjectId, ref: 'Organization' },
  userId:       { type: Schema.Types.ObjectId, ref: 'User' },
  action:       { type: String, required: true },
  resourceType: { type: String },
  resourceId:   { type: String },
  details:      { type: Schema.Types.Mixed },
  ipAddress:    { type: String },
}, { timestamps: true });

module.exports = {
  Organization:    mongoose.model('Organization',    OrganizationSchema),
  User:            mongoose.model('User',            UserSchema),
  Device:          mongoose.model('Device',          DeviceSchema),
  Session:         mongoose.model('Session',         SessionSchema),
  Screenshot:      mongoose.model('Screenshot',      ScreenshotSchema),
  TelemetryEvent:  mongoose.model('TelemetryEvent',  TelemetryEventSchema),
  EnrollmentToken: mongoose.model('EnrollmentToken', EnrollmentTokenSchema),
  License:         mongoose.model('License',         LicenseSchema),
  AuditLog:        mongoose.model('AuditLog',        AuditLogSchema),
};
ENDOFFILE
echo "✅ models/index.js"

# ─── middleware/auth.js ────────────────────────────────────────
cat > server/middleware/auth.js << 'ENDOFFILE'
const jwt = require('jsonwebtoken');
const { User, Device } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive)
      return res.status(401).json({ error: 'User not found or inactive' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

const agentAuthMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'Missing agent token' });
    const agentToken = header.replace('Bearer ', '');
    const device = await Device.findOne({ agentToken });
    if (!device)
      return res.status(401).json({ error: 'Invalid agent token' });
    req.device = device;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Auth error' });
  }
};

module.exports = { authMiddleware, requireRole, agentAuthMiddleware };
ENDOFFILE
echo "✅ middleware/auth.js"

# ─── routes/users.js ─────────────────────────────────────────
cat > server/routes/users.js << 'ENDOFFILE'
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const passwordHash = await bcrypt.hash(password || 'Welcome123!', 12);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, displayName, role: role||'employee', orgId: req.user.orgId });
    res.status(201).json({ ...user.toObject(), passwordHash: undefined });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const { displayName, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { displayName, role, isActive }, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireRole('admin','super_admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
ENDOFFILE
echo "✅ routes/users.js"

# ─── routes/organizations.js ─────────────────────────────────
cat > server/routes/organizations.js << 'ENDOFFILE'
const router = require('express').Router();
const { Organization } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'super_admin') {
      return res.json(await Organization.find().sort({ createdAt: -1 }));
    }
    const org = await Organization.findById(req.user.orgId);
    res.json(org ? [org] : []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(org);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
ENDOFFILE
echo "✅ routes/organizations.js"

# ─── routes/screenshots.js ───────────────────────────────────
cat > server/routes/screenshots.js << 'ENDOFFILE'
const router = require('express').Router();
const { Screenshot } = require('../models');
const { authMiddleware } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { deviceId, from, to, limit = 50 } = req.query;
    const filter = { orgId: req.user.orgId };
    if (deviceId) filter.deviceId = deviceId;
    if (from || to) {
      filter.capturedAt = {};
      if (from) filter.capturedAt.$gte = new Date(from);
      if (to)   filter.capturedAt.$lte = new Date(to);
    }
    const screenshots = await Screenshot.find(filter).sort({ capturedAt: -1 }).limit(parseInt(limit));
    const baseUrl = process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT||3000}`;
    res.json(screenshots.map(s => ({ ...s.toObject(), url: `${baseUrl}/screenshots/${s.filePath}` })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
ENDOFFILE
echo "✅ routes/screenshots.js"

# ─── routes/sessions.js ──────────────────────────────────────
cat > server/routes/sessions.js << 'ENDOFFILE'
const router = require('express').Router();
const { Session } = require('../models');
const { authMiddleware } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { deviceId, limit = 20 } = req.query;
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    const sessions = await Session.find(filter).populate('deviceId','hostname').sort({ sessionStart: -1 }).limit(parseInt(limit));
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
ENDOFFILE
echo "✅ routes/sessions.js"

# ─── routes/telemetry.js ─────────────────────────────────────
cat > server/routes/telemetry.js << 'ENDOFFILE'
const router = require('express').Router();
const { TelemetryEvent } = require('../models');
const { authMiddleware } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { deviceId, eventType, limit = 50 } = req.query;
    const filter = { orgId: req.user.orgId };
    if (deviceId)  filter.deviceId  = deviceId;
    if (eventType) filter.eventType = eventType;
    const events = await TelemetryEvent.find(filter).populate('deviceId','hostname').sort({ eventTime: -1 }).limit(parseInt(limit));
    res.json(events);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
ENDOFFILE
echo "✅ routes/telemetry.js"

# ─── routes/auditLogs.js ─────────────────────────────────────
cat > server/routes/auditLogs.js << 'ENDOFFILE'
const router = require('express').Router();
const { AuditLog } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', requireRole('admin','super_admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const logs = await AuditLog.find(filter).populate('userId','displayName email').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
ENDOFFILE
echo "✅ routes/auditLogs.js"

# ─── routes/licenses.js ──────────────────────────────────────
cat > server/routes/licenses.js << 'ENDOFFILE'
const router = require('express').Router();
const { License } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    res.json(await License.find(filter).populate('orgId','name'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:orgId', requireRole('super_admin'), async (req, res) => {
  try {
    const license = await License.findOneAndUpdate(
      { orgId: req.params.orgId }, req.body, { new: true, upsert: true }
    );
    res.json(license);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
ENDOFFILE
echo "✅ routes/licenses.js"

# ─── routes/dashboard.js ─────────────────────────────────────
cat > server/routes/dashboard.js << 'ENDOFFILE'
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
ENDOFFILE
echo "✅ routes/dashboard.js"

# ─── .env file ───────────────────────────────────────────────
if [ ! -f server/.env ]; then
cat > server/.env << 'ENDOFFILE'
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dk_productivity
JWT_SECRET=dk_super_secret_change_this_in_production_2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
SERVER_PUBLIC_URL=http://localhost:3000
ENDOFFILE
echo "✅ .env created (update IP if needed)"
else
echo "⚠️  .env already exists, skipping"
fi

# ─── seed.js (if missing) ────────────────────────────────────
if [ ! -f server/seed.js ]; then
cat > server/seed.js << 'ENDOFFILE'
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Organization, License } = require('./models');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dk_productivity');
  const existing = await User.findOne({ role: 'super_admin' });
  if (existing) { console.log('Super admin already exists:', existing.email); process.exit(0); }

  const org = await Organization.create({ name: 'Demo Company', domain: 'demo.local' });
  await License.create({ orgId: org._id, totalLicenses: 10 });
  await User.create({ email: 'admin@demo.local', passwordHash: await bcrypt.hash('Demo@123', 12), displayName: 'Demo Admin', role: 'admin', orgId: org._id });
  await User.create({ email: 'superadmin@dk.local', passwordHash: await bcrypt.hash('Admin@123', 12), displayName: 'Super Admin', role: 'super_admin' });

  console.log('✅ Seeded!\n  superadmin@dk.local / Admin@123\n  admin@demo.local / Demo@123');
  await mongoose.disconnect();
}
seed().catch(err => { console.error(err); process.exit(1); });
ENDOFFILE
echo "✅ seed.js"
fi

# ─── Final structure check ────────────────────────────────────
echo ""
echo "═══════════════════════════════════"
echo "  Final Structure:"
echo "═══════════════════════════════════"
find ~/project -not -path '*/node_modules/*' -not -path '*/.git/*' \
     -not -path '*/dk-insight-suite-main/*' \
     -not -path '*/mnt/*' | sort | sed 's|'$HOME'/project/||' | head -60

echo ""
echo "═══════════════════════════════════"
echo "  Next Steps:"
echo "═══════════════════════════════════"
echo "  cd ~/project/server"
echo "  npm install"
echo "  npm run seed"
echo "  npm start"
echo "═══════════════════════════════════"
