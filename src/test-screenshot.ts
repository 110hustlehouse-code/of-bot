import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import 'dotenv/config';

chromium.use(StealthPlugin());

async function screenshot() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  
  await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  
  console.log('TITLE:', await page.title());
  console.log('URL:', page.url());
  
  const bodyText = await page.$eval('body', el => el.innerText.slice(0, 500));
  console.log('BODY:', bodyText);
  
  const inputs = await page.$$eval('input', els => els.map(el => ({
    type: el.getAttribute('type'),
    placeholder: el.getAttribute('placeholder'),
    class: el.className.slice(0, 80),
  })));
  console.log('INPUTS:', JSON.stringify(inputs, null, 2));
  
  await page.screenshot({ path: '/tmp/of-login.png', fullPage: true });
  console.log('Screenshot saved');
  await browser.close();
}

screenshot();
