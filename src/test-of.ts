import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import 'dotenv/config';

chromium.use(StealthPlugin());

async function testOF() {
  const email = process.env.OF_TEST_EMAIL!;
  const password = process.env.OF_TEST_PASSWORD!;
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  // Intercetta le richieste API di OF durante il login
  const apiCalls: any[] = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api2/') || url.includes('onlyfans.com/api')) {
      try {
        const body = await response.text();
        apiCalls.push({ url, status: response.status(), body: body.slice(0, 200) });
      } catch {}
    }
  });

  await page.goto('https://onlyfans.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const acceptBtn = await page.$('button.m-rounded');
  if (acceptBtn) { await acceptBtn.click(); await page.waitForTimeout(1000); }

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(6000);

  console.log('URL:', page.url());
  console.log('\nAPI CALLS DURANTE LOGIN:');
  apiCalls.forEach(c => console.log(`${c.status} ${c.url}\n${c.body}\n---`));

  // Leggi cookies
  const cookies = await context.cookies();
  console.log('\nCOOKIES:', cookies.map(c => `${c.name}=${c.value.slice(0,20)}`).join(', '));

  await browser.close();
}

testOF();
