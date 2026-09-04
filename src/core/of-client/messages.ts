import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

const API_BASE = 'https://app.onlyfansapi.com/api';

export interface OFMessage {
  id: string;
  fanId: string;
  fanName: string;
  content: string;
  timestamp: Date;
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
    throw new Error(`OnlyFansAPI error ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

// Polling nuovi messaggi da tutte le chat
export async function pollNewMessages(accountId: string, creatorId: string): Promise<OFMessage[]> {
  try {
    // Lista chat recenti
    const chats = await apiCall(`/${accountId}/chats?limit=20&order=recent`);
    const messages: OFMessage[] = [];
    
    for (const chat of chats.data ?? []) {
      // Solo chat con messaggi non letti
      if (chat.unreadMessagesCount > 0) {
        const chatMessages = await apiCall(`/${accountId}/chats/${chat.withUser.id}/messages?limit=5`);
        
        for (const msg of chatMessages.data ?? []) {
          // Solo messaggi in entrata (dal fan, non nostri)
          if (msg.fromUser?.id === chat.withUser.id && msg.text) {
            messages.push({
              id: `${chat.withUser.id}_${msg.id}`,
              fanId: chat.withUser.id.toString(),
              fanName: chat.withUser.name ?? chat.withUser.username ?? 'Fan',
              content: msg.text,
              timestamp: new Date(msg.createdAt),
            });
          }
        }
      }
    }
    
    logger.debug(`Polled ${messages.length} new messages for creator ${creatorId}`);
    return messages;
  } catch (err) {
    logger.error(`Poll failed for creator ${creatorId}: ${err}`);
    return [];
  }
}

// Invia messaggio a un fan
export async function sendMessage(accountId: string, fanId: string, text: string): Promise<boolean> {
  try {
    await apiCall(`/${accountId}/chats/${fanId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    logger.info(`Message sent to fan ${fanId}`);
    return true;
  } catch (err) {
    logger.error(`Send failed to fan ${fanId}: ${err}`);
    return false;
  }
}

// Invia PPV (paid message)
export async function sendPPV(
  accountId: string, 
  fanId: string, 
  text: string, 
  price: number, 
  mediaIds: number[] = []
): Promise<boolean> {
  try {
    await apiCall(`/${accountId}/chats/${fanId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, price, mediaFiles: mediaIds }),
    });
    logger.info(`PPV sent to fan ${fanId} for $${price}`);
    return true;
  } catch (err) {
    logger.error(`PPV send failed: ${err}`);
    return false;
  }
}
