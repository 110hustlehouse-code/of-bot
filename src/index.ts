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

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/creators', creatorRouter);
app.use('/api/fans', fanRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/safety', safetyRouter);

app.listen(env.PORT, () => {
  logger.info(`OF Bot API running on port ${env.PORT}`);
  startMessageWorker();
  startScheduler();
});