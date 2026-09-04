import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { agencies } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

settingsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, req.agencyId!),
    });
    res.json({ telegramChatId: agency?.telegramChatId ?? null });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

settingsRouter.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { telegramChatId } = req.body;
    await db.update(agencies)
      .set({ telegramChatId })
      .where(eq(agencies.id, req.agencyId!));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});