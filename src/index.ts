import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startMessageWorker } from './queue/message-worker.js';
import { startScheduler } from './queue/scheduler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

app.listen(env.PORT, () => {
  logger.info(`OF Bot API running on port ${env.PORT}`);
  startMessageWorker();
  startScheduler();
});