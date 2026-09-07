import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

let bot: any = null;

async function getBot() {
  if (bot) return bot;
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  const TelegramBot = (await import('node-telegram-bot-api')).default;
  bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
  return bot;
}

export async function notifyHandoff(
  chatId: string,
  creatorName: string,
  fanName: string,
  fanMessage: string,
  reason: string
): Promise<void> {
  const b = await getBot();
  if (!b || !chatId) return;

  const text = `🔴 *Human Handoff Required*

*Creator:* ${creatorName}
*Fan:* ${fanName}
*Reason:* ${reason}

*Message:*
${fanMessage.slice(0, 300)}

_Reply to this fan manually on OnlyFans._`;

  try {
    await b.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    logger.info(`Telegram handoff sent for fan ${fanName}`);
  } catch (err) {
    logger.error(`Telegram notification failed: ${err}`);
  }
}

export async function notifyAlert(
  chatId: string,
  title: string,
  details: string
): Promise<void> {
  const b = await getBot();
  if (!b || !chatId) return;

  try {
    await b.sendMessage(chatId, `⚠️ *${title}*\n\n${details}`, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error(`Telegram alert failed: ${err}`);
  }
}

export async function notifyWhaleActivity(
  chatId: string,
  creatorName: string,
  fanName: string,
  totalSpent: number,
  message: string
): Promise<void> {
  const b = await getBot();
  if (!b || !chatId) return;

  try {
    await b.sendMessage(chatId, `🐋 *Whale Active*

*Creator:* ${creatorName}
*Fan:* ${fanName}
*Total Spent:* $${totalSpent.toFixed(0)}

_${message.slice(0, 200)}_`, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error(`Telegram whale alert failed: ${err}`);
  }
}
