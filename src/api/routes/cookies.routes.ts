import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { creators } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '../../utils/crypto.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { restoreSession } from '../../core/of-client/auth.js';
import { logger } from '../../utils/logger.js';

export const cookiesRouter = Router();
cookiesRouter.use(authMiddleware);

// Upload cookies JSON per una creator
cookiesRouter.post('/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const { cookiesJson } = req.body;

    if (!cookiesJson) {
      res.status(400).json({ error: 'cookiesJson required' });
      return;
    }

    // Valida che siano cookie validi
    JSON.parse(cookiesJson);

    // Testa la sessione prima di salvarla
    const session = await restoreSession(creatorId, cookiesJson);
    await session.context.close();

    // Salva encrypted nel DB
    const encrypted = encrypt(cookiesJson);
    await db.update(creators)
      .set({ ofCredentialsEnc: encrypted })
      .where(eq(creators.id, creatorId));

    logger.info(`Cookies updated for creator ${creatorId}`);
    res.json({ success: true, message: 'Session restored and saved' });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Verifica sessione attiva
cookiesRouter.get('/:creatorId/check', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });

    if (!creator) {
      res.status(404).json({ error: 'Creator not found' });
      return;
    }

    const { ofCredentialsEnc } = creator;
    const decrypted = decrypt(ofCredentialsEnc);

    // Prova a capire se sono cookie o credenziali
    const parsed = JSON.parse(decrypted);
    const isCookies = Array.isArray(parsed);

    if (!isCookies) {
      res.json({ valid: false, message: 'Using old credential format — upload cookies' });
      return;
    }

    const session = await restoreSession(creatorId, decrypted);
    await session.context.close();
    res.json({ valid: true, message: 'Session active' });
  } catch (err) {
    res.json({ valid: false, message: `${err}` });
  }
});
