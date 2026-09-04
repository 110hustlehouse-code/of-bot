import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

const API_BASE = 'https://app.onlyfansapi.com/api';

export interface OFAccount {
  accountId: string;
  onlyfansId: number;
  username: string;
}

async function apiCall(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.ONLYFANSAPI_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OnlyFansAPI error ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// Autentica un account OF (login iniziale)
export async function authenticateOF(email: string, password: string): Promise<{ attemptId: string; pollingUrl: string }> {
  logger.info(`Starting auth for ${email}`);
  const response = await apiCall('/authenticate', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return {
    attemptId: response.attempt_id,
    pollingUrl: response.polling_url,
  };
}

// Polling stato autenticazione
export async function pollAuthStatus(attemptId: string): Promise<any> {
  return apiCall(`/authenticate/${attemptId}`);
}

// Attende che l'auth sia completata
export async function waitForAuth(attemptId: string, maxWaitMs = 60000): Promise<OFAccount> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const status = await pollAuthStatus(attemptId);
    
    if (status.state === 'authenticated') {
      return {
        accountId: status.account.id,
        onlyfansId: status.account.onlyfans_data.id,
        username: status.account.onlyfans_data.username,
      };
    }
    
    if (status.state === 'auth-failed') {
      throw new Error(`Auth failed: ${status.lastAttempt?.error_message}`);
    }
    
    if (status.lastAttempt?.needs_otp) {
      throw new Error('2FA required — submit OTP via API');
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Auth timeout');
}

// Lista account collegati
export async function listAccounts(): Promise<any[]> {
  return apiCall('/accounts');
}

// Rimuovi account
export async function disconnectAccount(accountId: string): Promise<void> {
  await apiCall(`/accounts/${accountId}`, { method: 'DELETE' });
  logger.info(`Account ${accountId} disconnected`);
}

// Verifica se account è ancora autenticato
export async function checkAccountStatus(accountId: string): Promise<boolean> {
  const accounts = await listAccounts();
  const account = accounts.find(a => a.id === accountId);
  return account?.is_authenticated ?? false;
}
