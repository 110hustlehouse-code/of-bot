import { checkAccountStatus } from './auth.js';
import { logger } from '../../utils/logger.js';

// Cache dello stato account (accountId → autenticato?)
const authCache = new Map<string, { valid: boolean; lastCheck: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti

export async function isAccountValid(accountId: string): Promise<boolean> {
  const cached = authCache.get(accountId);
  if (cached && Date.now() - cached.lastCheck < CACHE_TTL_MS) {
    return cached.valid;
  }
  
  const valid = await checkAccountStatus(accountId);
  authCache.set(accountId, { valid, lastCheck: Date.now() });
  
  if (!valid) {
    logger.warn(`Account ${accountId} not authenticated`);
  }
  return valid;
}

export function invalidateAccount(accountId: string): void {
  authCache.delete(accountId);
}
