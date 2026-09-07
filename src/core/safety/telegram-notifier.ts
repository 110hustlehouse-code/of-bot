import TelegramBotApi from 'node-telegram-bot-api';
const TelegramBot = TelegramBotApi as any;
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const bot = env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(env.TELEGRAM_BOT_TOKEN)
  : null;

export async function notifyHandoff(
  chatId: string,
  creatorName: string,
  fanName: string,
  fanMessage: string,
  reason: string
): Promise<void> {
  if (!bot || !chatId) return;

  const text = `🔴 *Human Handoff Required*

*Creator:* ${creatorName}
*Fan:* ${fanName}
*Reason:* ${reason}

*Message:*
${fanMessage.slice(0, 300)}

_Reply to this fan manually on OnlyFans._`;

  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
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
  if (!bot || !chatId) return;

  try {
    await bot.sendMessage(chatId, `⚠️ *${title}*\n\n${details}`, { parse_mode: 'Markdown' });
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
  if (!bot || !chatId) return;

  try {
    await bot.sendMessage(chatId, `🐋 *Whale Active*

*Creator:* ${creatorName}
*Fan:* ${fanName}
*Total Spent:* $${totalSpent.toFixed(0)}

_${message.slice(0, 200)}_`, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error(`Telegram whale alert failed: ${err}`);
  }
}