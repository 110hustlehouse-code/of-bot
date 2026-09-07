import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { creators } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { encrypt } from '../../utils/crypto.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { killCreator } from '../../core/safety/kill-switch.js';
import { authenticateOF, waitForAuth, disconnectAccount, listAccounts } from '../../core/of-client/auth.js';
import { logger } from '../../utils/logger.js';

export const creatorRouter = Router();
creatorRouter.use(authMiddleware);

creatorRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await db.query.creators.findMany({
      where: eq(creators.agencyId, req.agencyId!),
    });
    res.json(list.map(c => ({ ...c, ofCredentialsEnc: undefined })));
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

creatorRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ofUsername, email, password, personaPrompt } = req.body;
    if (!name || !ofUsername || !email || !password) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const accounts = await listAccounts();
    let accountId: string;
    let username = ofUsername;

    const existing = accounts.find((a: any) =>
      a.onlyfans_email === email || a.display_name === email
    );

    if (existing && existing.is_authenticated) {
      logger.info(`Reusing existing account ${existing.id}`);
      accountId = existing.id;
      username = existing.onlyfans_username ?? ofUsername;
    } else {
      logger.info(`Authenticating new creator ${name}...`);
      const { attemptId } = await authenticateOF(email, password);
      const account = await waitForAuth(attemptId);
      accountId = account.accountId;
      username = account.username;
    }

    const ofCredentialsEnc = encrypt(accountId);

    const [creator] = await db.insert(creators).values({
      agencyId: req.agencyId!,
      name,
      ofUsername: username,
      ofCredentialsEnc,
      personaPrompt,
    }).returning();

    res.status(201).json({ ...creator, ofCredentialsEnc: undefined, connected: true });
  } catch (err) {
    logger.error(`Creator creation failed: ${err}`);
    res.status(500).json({ error: `${err}` });
  }
});

creatorRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { personaPrompt, isActive } = req.body;
    const [updated] = await db.update(creators)
      .set({ personaPrompt, isActive })
      .where(eq(creators.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: 'Creator not found' });
      return;
    }
    res.json({ ...updated, ofCredentialsEnc: undefined });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

creatorRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const creator = await db.query.creators.findFirst({ where: eq(creators.id, id) });

    if (creator?.ofCredentialsEnc) {
      const { decrypt } = await import('../../utils/crypto.js');
      const accountId = decrypt(creator.ofCredentialsEnc);
      try { await disconnectAccount(accountId); } catch {}
    }

    await killCreator(id, 'Deleted by agency');
    await db.delete(creators).where(eq(creators.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

creatorRouter.put('/:id/telegram', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { telegramBotToken } = req.body;

    const [updated] = await db.update(creators)
      .set({ telegramBotToken } as any)
      .where(eq(creators.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Creator not found' });
      return;
    }

    // Avvia/riavvia il bot TG
    if (telegramBotToken) {
      const { stopTelegramBot, startTelegramBot } = await import('../../core/tg-client/tg-bot.js');
      await stopTelegramBot(id);
      await startTelegramBot(id, telegramBotToken);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});