import { OFSession, createOFSession, restoreSession } from './auth.js';
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

  let session: OFSession;

  if (savedCookies) {
    try {
      session = await restoreSession(creatorId, savedCookies);
    } catch {
      logger.warn(`Cookie restore failed for ${creatorId}, doing fresh login`);
      session = await createOFSession(creatorId, email, password);
    }
  } else {
    session = await createOFSession(creatorId, email, password);
  }

  sessions.set(creatorId, session);
  return session;
}

export function removeSession(creatorId: string): void {
  sessions.delete(creatorId);
  logger.info(`Session removed for creator ${creatorId}`);
}

export function getActiveSessions(): string[] {
  return Array.from(sessions.keys());
}