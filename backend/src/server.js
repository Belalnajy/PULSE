require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./db');
const { initDb } = require('./initDb');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
// License and per-user OpenAI key routes removed under new global key & subscription model
const chatRoutes = require('./routes/chat');
const campaignsRoutes = require('./routes/campaigns');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');
const paymentsRoutes = require('./routes/payments');

const app = express();
const BUILD_MARKER = `ai-prompt-fix-${new Date()
  .toISOString()
  .slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
const corsOrigins = (
  process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const ok = corsOrigins.includes(origin);
      callback(ok ? null : new Error('Not allowed by CORS'), ok);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.raw('select 1');
    res.json({
      status: 'ok',
      app: 'Social Marketing AI Assistant',
      time: new Date().toISOString(),
      buildMarker: BUILD_MARKER,
      port: String(process.env.PORT || '5000'),
      nodeEnv: String(process.env.NODE_ENV || ''),
      rateLimitDevDisable: String(process.env.RATE_LIMIT_DEV_DISABLE || ''),
      fairEnforce: String(process.env.FAIR_ENFORCE || ''),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.use('/auth', authRoutes);
app.use('/subscription', subscriptionRoutes);
// app.use('/api/license', licenseRoutes);
// app.use('/api/openai-key', openaiKeyRoutes);
app.use('/chat', chatRoutes);
app.use('/campaigns', campaignsRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/support', supportRoutes);
app.use('/payments', paymentsRoutes);
app.use('/plans', require('./routes/plans'));
app.use('/testimonials', require('./routes/testimonials'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const { startReminderScheduler } = require('./services/subscriptionReminder');

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
      // Start subscription expiry reminder scheduler
      startReminderScheduler();
    });
  })
  .catch((err) => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
