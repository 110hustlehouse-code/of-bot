import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { creators } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '../../utils/crypto.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { killCreator, reviveCreator } from '../../core/safety/kill-switch.js';

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

    const ofCredentialsEnc = encrypt(JSON.stringify({ email, password }));
    const [creator] = await db.insert(creators).values({
      agencyId: req.agencyId!,
      name,
      ofUsername,
      ofCredentialsEnc,
      personaPrompt,
    }).returning();

    res.status(201).json({ ...creator, ofCredentialsEnc: undefined });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

creatorRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { personaPrompt, isActive } = req.body;
    const [updated] = await db.update(creators)
      .set({ personaPrompt, isActive })
      .where(and(
        eq(creators.id, req.params.id),
        eq(creators.agencyId, req.agencyId!)
      ))
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
    await killCreator(req.params.id, 'Deleted by agency');
    await db.delete(creators)
      .where(and(
        eq(creators.id, req.params.id),
        eq(creators.agencyId, req.agencyId!)
      ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});