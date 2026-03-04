const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
app.locals.sseClients = [];

app.use(helmet());
app.use(cors({ origin: "*", credentials: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/downloads',   express.static(path.join(__dirname, 'downloads')));
app.use('/screenshots', express.static(path.join(__dirname, 'uploads/screenshots')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dk_productivity')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ─── Dashboard / Auth / Admin routes ─────────────────────────────────────────
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

// ─── Agent routes (both old and new paths) ───────────────────────────────────
const agentEnroll     = require('./routes/agentEnroll');
const agentHeartbeat  = require('./routes/agentHeartbeat');
const agentScreenshot = require('./routes/agentScreenshot');
const agentEvents     = require('./routes/agentEvents');

app.use('/agent-enroll',         agentEnroll);
app.use('/agent-heartbeat',      agentHeartbeat);
app.use('/agent-screenshot',     agentScreenshot);
app.use('/agent-events',         agentEvents);
app.use('/api/agent/enroll',     agentEnroll);
app.use('/api/agent/heartbeat',  agentHeartbeat);
app.use('/api/agent/screenshot', agentScreenshot);
app.use('/api/agent/events',     agentEvents);

// ─── SSE Real-time feed ───────────────────────────────────────────────────────
const { authMiddleware } = require('./middleware/auth');
app.get('/api/events/stream', async (req, res) => {
  // Support token via query param for EventSource
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = 'Bearer ' + req.query.token;
  }
  // Run authMiddleware manually
  await new Promise((resolve) => authMiddleware(req, res, resolve));
  if (!req.user) return;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { res, orgId: req.user.orgId, userId: req.user._id };
  app.locals.sseClients.push(client);
  console.log(`SSE client connected: ${req.user.email} (total: ${app.locals.sseClients.length})`);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time feed active' })}\n\n`);

  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    app.locals.sseClients = app.locals.sseClients.filter(c => c !== client);
    console.log(`SSE client disconnected (total: ${app.locals.sseClients.length})`);
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DK Productivity Server running on http://0.0.0.0:${PORT}`);
});
