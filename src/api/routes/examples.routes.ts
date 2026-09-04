import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { creatorExamples } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const examplesRouter = Router();
examplesRouter.use(authMiddleware);

// Lista esempi di un creator
examplesRouter.get('/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const examples = await db.query.creatorExamples.findMany({
      where: eq(creatorExamples.creatorId, creatorId),
    });
    res.json(examples);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Aggiungi un esempio
examplesRouter.post('/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const { fanMessage, creatorReply, category } = req.body;

    if (!fanMessage || !creatorReply) {
      res.status(400).json({ error: 'fanMessage and creatorReply required' });
      return;
    }

    const [example] = await db.insert(creatorExamples).values({
      creatorId,
      fanMessage,
      creatorReply,
      category: category ?? 'general',
    }).returning();

    res.status(201).json(example);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Upload bulk (array di esempi)
examplesRouter.post('/:creatorId/bulk', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const { examples } = req.body;

    if (!Array.isArray(examples) || examples.length === 0) {
      res.status(400).json({ error: 'examples array required' });
      return;
    }

    const values = examples.map((ex: any) => ({
      creatorId,
      fanMessage: ex.fanMessage,
      creatorReply: ex.creatorReply,
      category: ex.category ?? 'general',
    }));

    const inserted = await db.insert(creatorExamples).values(values).returning();
    res.status(201).json({ count: inserted.length });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Elimina un esempio
examplesRouter.delete('/:creatorId/:exampleId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exampleId = req.params.exampleId as string;
    await db.delete(creatorExamples).where(eq(creatorExamples.id, exampleId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});