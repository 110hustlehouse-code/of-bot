import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startMessageWorker } from './queue/message-worker.js';
import { startScheduler } from './queue/scheduler.js';
import { authRouter } from './api/routes/auth.routes.js';
import { creatorRouter } from './api/routes/creator.routes.js';
import { fanRouter } from './api/routes/fan.routes.js';
import { analyticsRouter } from './api/routes/analytics.routes.js';
import { safetyRouter } from './api/routes/safety.routes.js';
import { voiceRouter } from './api/routes/voice.routes.js';

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/creators', creatorRouter);
app.use('/api/fans', fanRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/voice', voiceRouter);

app.listen(env.PORT, () => {
  logger.info(`Aura API running on port ${env.PORT}`);
  startMessageWorker();
  startScheduler();
});