import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

async function sendTelegram(chatId: string, text: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (err) {
    logger.error(`Telegram send failed: ${err}`);
  }
}

export async function notifyHandoff(
  chatId: string,
  creatorName: string,
  fanName: string,
  fanMessage: string,
  reason: string
): Promise<void> {
  await sendTelegram(chatId, `🔴 *Human Handoff*\n*Creator:* ${creatorName}\n*Fan:* ${fanName}\n*Reason:* ${reason}\n\n_${fanMessage.slice(0, 300)}_`);
  logger.info(`Telegram handoff sent for fan ${fanName}`);
}

export async function notifyAlert(
  chatId: string,
  title: string,
  details: string
): Promise<void> {
  await sendTelegram(chatId, `⚠️ *${title}*\n\n${details}`);
}

export async function notifyWhaleActivity(
  chatId: string,
  creatorName: string,
  fanName: string,
  totalSpent: number,
  message: string
): Promise<void> {
  await sendTelegram(chatId, `🐋 *Whale Active*\n*Creator:* ${creatorName}\n*Fan:* ${fanName}\n*Spent:* $${totalSpent.toFixed(0)}\n\n_${message.slice(0, 200)}_`);
}
