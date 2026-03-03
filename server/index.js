const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*", credentials: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static screenshots folder
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
app.use('/screenshots', express.static(path.join(__dirname, 'uploads/screenshots')));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dk_productivity')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/devices',       require('./routes/devices'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/screenshots',   require('./routes/screenshots'));
app.use('/api/sessions',      require('./routes/sessions'));
app.use('/api/telemetry',     require('./routes/telemetry'));
app.use('/api/audit-logs',    require('./routes/auditLogs'));
app.use('/api/enrollment',    require('./routes/enrollment'));
app.use('/api/licenses',      require('./routes/licenses'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// Agent endpoints (called by Windows C# agent)
app.use('/agent-enroll',      require('./routes/agentEnroll'));
app.use('/agent-heartbeat',   require('./routes/agentHeartbeat'));
app.use('/agent-screenshot',  require('./routes/agentScreenshot'));
app.use('/agent-events',      require('./routes/agentEvents'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DK Productivity Server running on http://0.0.0.0:${PORT}`);
});
