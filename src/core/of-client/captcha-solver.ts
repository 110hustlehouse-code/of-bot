import { Solver } from '2captcha-ts';
import { logger } from '../../utils/logger.js';

const solver = process.env.TWOCAPTCHA_API_KEY
  ? new Solver(process.env.TWOCAPTCHA_API_KEY)
  : null;

const RECAPTCHA_VISIBLE = '6LddGoYgAAAAAHD275rVBjuOYXiofr1u4pFS5lHn';

export async function solveCaptcha(pageUrl: string): Promise<string | null> {
  if (!solver) {
    logger.warn('2captcha not configured');
    return null;
  }

  try {
    logger.info('Solving reCAPTCHA Enterprise...');
    const result = await solver.recaptcha({
      googlekey: RECAPTCHA_VISIBLE,
      pageurl: pageUrl,
      enterprise: 1,
      version: 'v2',
      action: 'login',
    } as any);
    logger.info('Captcha token received');
    return result.data;
  } catch (err) {
    logger.error(`Captcha solving failed: ${err}`);
    return null;
  }
}
