import { Page } from 'playwright';
import { logger } from '../../utils/logger.js';

export interface OFMessage {
  id: string;
  fanId: string;
  fanName: string;
  content: string;
  timestamp: Date;
}

export async function pollNewMessages(page: Page, creatorId: string): Promise<OFMessage[]> {
  try {
    await page.goto('https://onlyfans.com/my/chats', { waitUntil: 'networkidle' });
    const messages: OFMessage[] = [];

    const chats = await page.$$eval(
      '[class*="chat-item"]',
      (els) => els.map((el) => ({
        fanId: el.getAttribute('data-user-id') ?? '',
        fanName: el.querySelector('[class*="name"]')?.textContent?.trim() ?? '',
        hasUnread: el.classList.toString().includes('unread'),
      }))
    );

    for (const chat of chats.filter((c) => c.hasUnread && c.fanId)) {
      const lastMsg = await getLastFanMessage(page, chat.fanId);
      if (lastMsg) {
        messages.push({
          id: `${chat.fanId}_${Date.now()}`,
          fanId: chat.fanId,
          fanName: chat.fanName,
          content: lastMsg,
          timestamp: new Date(),
        });
      }
    }

    logger.debug(`Polled ${messages.length} new messages for creator ${creatorId}`);
    return messages;
  } catch (err) {
    logger.error(`Poll failed for creator ${creatorId}: ${err}`);
    return [];
  }
}

async function getLastFanMessage(page: Page, fanId: string): Promise<string | null> {
  try {
    await page.goto(`https://onlyfans.com/my/chats/chat/${fanId}`, { waitUntil: 'networkidle' });
    const msgs = await page.$$eval(
      '[class*="message"]:not([class*="own"])',
      (els) => els.map((el) => el.textContent?.trim() ?? '')
    );
    return msgs[msgs.length - 1] ?? null;
  } catch {
    return null;
  }
}

export async function sendMessage(page: Page, fanId: string, text: string): Promise<boolean> {
  try {
    await page.goto(`https://onlyfans.com/my/chats/chat/${fanId}`, { waitUntil: 'networkidle' });

    const input = await page.$('[class*="chat-input"], textarea[placeholder*="message"]');
    if (!input) throw new Error('Chat input not found');

    await input.click();
    await input.type(text, { delay: 30 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    logger.info(`Message sent to fan ${fanId}`);
    return true;
  } catch (err) {
    logger.error(`Send failed to fan ${fanId}: ${err}`);
    return false;
  }
}