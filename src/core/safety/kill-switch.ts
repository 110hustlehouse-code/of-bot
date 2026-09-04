import { db } from '../../db/index.js';
import { creators, auditLog } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { invalidateAccount } from '../of-client/session-manager.js';
import { logger } from '../../utils/logger.js';

const killedCreators = new Set<string>();

export function isKilled(creatorId: string): boolean {
  return killedCreators.has(creatorId);
}

export async function killCreator(creatorId: string, reason: string): Promise<void> {
  killedCreators.add(creatorId);
  invalidateAccount(creatorId);

  await db.update(creators)
    .set({ isActive: false })
    .where(eq(creators.id, creatorId));

  await db.insert(auditLog).values({
    creatorId,
    action: 'kill_switch',
    details: { reason },
  });

  logger.warn(`KILL SWITCH activated for creator ${creatorId}: ${reason}`);
}

export async function reviveCreator(creatorId: string): Promise<void> {
  killedCreators.delete(creatorId);
  await db.update(creators)
    .set({ isActive: true })
    .where(eq(creators.id, creatorId));
  logger.info(`Creator ${creatorId} revived`);
}