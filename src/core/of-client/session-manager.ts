import { OFSession, restoreSession } from './auth.js';
import { logger } from '../../utils/logger.js';

const sessions = new Map<string, OFSession>();

export async function getSession(
  creatorId: string,
  email: string,
  password: string,
  savedCookies?: string
): Promise<OFSession> {
  if (sessions.has(creatorId)) {
    return sessions.get(creatorId)!;
  }

  if (!savedCookies) {
    throw new Error(`No cookies for creator ${creatorId}. Export cookies from browser after manual login.`);
  }

  try {
    const session = await restoreSession(creatorId, savedCookies);
    sessions.set(creatorId, session);
    return session;
  } catch (err) {
    logger.error(`Session restore failed for ${creatorId}: ${err}`);
    throw err;
  }
}

export function removeSession(creatorId: string): void {
  sessions.delete(creatorId);
  logger.info(`Session removed for creator ${creatorId}`);
}

export function getActiveSessions(): string[] {
  return Array.from(sessions.keys());
}
