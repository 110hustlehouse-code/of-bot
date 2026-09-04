import { listAccounts } from './core/of-client/auth.js';
import 'dotenv/config';

async function test() {
  const accounts = await listAccounts();
  console.log('Accounts:', JSON.stringify(accounts, null, 2));
}

test();
