import { chromium, BrowserContext, Page } from 'playwright';
import { logger } from '../../utils/logger.js';
import { getProxyConfig } from '../../utils/proxy.js';

const OF_BASE = 'https://onlyfans.com';

export interface OFSession {
  context: BrowserContext;
  page: Page;
  creatorId: string;
}

export async function createOFSession(
  creatorId: string,
  email: string,
  password: string
): Promise<OFSession> {
  const proxy = getProxyConfig();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    proxy: proxy as any,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  try {
    await page.goto(`${OF_BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${OF_BASE}/`, { timeout: 15000 });
    logger.info(`OF session created for creator ${creatorId}`);
    return { context, page, creatorId };
  } catch (err) {
    await browser.close();
    throw new Error(`OF login failed for creator ${creatorId}: ${err}`);
  }
}

export async function saveSessionCookies(session: OFSession): Promise<string> {
  const cookies = await session.context.cookies();
  return JSON.stringify(cookies);
}

export async function restoreSession(
  creatorId: string,
  cookiesJson: string
): Promise<OFSession> {
  const proxy = getProxyConfig();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    proxy: proxy as any,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });

  const cookies = JSON.parse(cookiesJson);
  await context.addCookies(cookies);

  const page = await context.newPage();
  await page.goto(OF_BASE, { waitUntil: 'networkidle' });

  const isLoggedIn = await page.$('a[href="/my/chats"]');
  if (!isLoggedIn) throw new Error(`Session expired for creator ${creatorId}`);

  logger.info(`OF session restored for creator ${creatorId}`);
  return { context, page, creatorId };
}