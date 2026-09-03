import { Queue } from 'bullmq';
import { db } from '../db/index.js';
import { creators } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const POLL_INTERVAL_MS = 10_000;

// Queue definita qui, non importata da message-worker → rompe dipendenza circolare
const pollQueue = new Queue('poll-messages', { connection: { url: env.REDIS_URL } });

export async function startScheduler(): Promise<void> {
  logger.info('Scheduler started — polling every 10s');

  const tick = async (): Promise<void> => {
    try {
      const activeCreators = await db.query.creators.findMany({
        where: eq(creators.isActive, true),
      });

      for (const creator of activeCreators) {
        await pollQueue.add(
          'poll',
          { creatorId: creator.id },
          {
            jobId: `poll-${creator.id}`,
            removeOnComplete: true,
            removeOnFail: 50,
          }
        );
      }
    } catch (err) {
      logger.error(`Scheduler tick error: ${err}`);
    }
  };

  // Prima esecuzione immediata, poi ogni 10s
  await tick();
  setInterval(tick, POLL_INTERVAL_MS);
}