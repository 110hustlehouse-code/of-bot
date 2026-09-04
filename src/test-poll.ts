import { pollNewMessages, sendMessage } from './core/of-client/messages.js';
import { logger } from './utils/logger.js';
import 'dotenv/config';

async function test() {
  const accountId = 'acct_be07bf64830045598e85cd3313c329c4';
  
  logger.info('Polling messages...');
  const messages = await pollNewMessages(accountId, 'test');
  logger.info(`Found ${messages.length} messages`);
  
  messages.forEach(m => {
    logger.info(`Fan: ${m.fanName} | Message: ${m.content}`);
  });
}

test();
