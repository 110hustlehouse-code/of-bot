import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { humanTakeover, messages, fans } from '../../db/schema.js';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { sendMessage } from '../../core/of-client/messages.js';
import { decrypt } from '../../utils/crypto.js';
import { creators } from '../../db/schema.js';
import { logger } from '../../utils/logger.js';

export const takeoverRouter = Router();
takeoverRouter.use(authMiddleware);

// Attiva takeover per un fan
takeoverRouter.post('/start', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { creatorId, fanId } = req.body;

    // Chiudi eventuali takeover precedenti attivi
    await db.update(humanTakeover)
      .set({ isActive: false, endedAt: new Date() })
      .where(and(eq(humanTakeover.creatorId, creatorId), eq(humanTakeover.fanId, fanId), eq(humanTakeover.isActive, true)));

    const [takeover] = await db.insert(humanTakeover).values({
      creatorId,
      fanId,
    }).returning();

    logger.info(`Takeover started for creator ${creatorId} fan ${fanId}`);
    res.json(takeover);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Termina takeover
takeoverRouter.post('/stop', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { creatorId, fanId } = req.body;

    await db.update(humanTakeover)
      .set({ isActive: false, endedAt: new Date() })
      .where(and(eq(humanTakeover.creatorId, creatorId), eq(humanTakeover.fanId, fanId), eq(humanTakeover.isActive, true)));

    logger.info(`Takeover ended for creator ${creatorId} fan ${fanId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Invia messaggio come umano durante takeover
takeoverRouter.post('/send', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { creatorId, fanId, text } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text required' });
      return;
    }

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });
    if (!creator) {
      res.status(404).json({ error: 'Creator not found' });
      return;
    }

    const fan = await db.query.fans.findFirst({
      where: eq(fans.id, fanId),
    });
    if (!fan) {
      res.status(404).json({ error: 'Fan not found' });
      return;
    }

    // Invia su OF
    const accountId = decrypt(creator.ofCredentialsEnc);
    const sent = await sendMessage(accountId, fan.ofFanId, text);

    if (sent) {
      await db.insert(messages).values({
        creatorId,
        fanId,
        direction: 'out',
        content: text,
        isAi: false,
        salesPhase: 'takeover',
      });
    }

    res.json({ success: sent });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Lista takeover attivi
takeoverRouter.get('/active/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const active = await db.query.humanTakeover.findMany({
      where: and(eq(humanTakeover.creatorId, creatorId), eq(humanTakeover.isActive, true)),
    });
    res.json(active);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Chat history per fan (per visualizzare nella dashboard)
takeoverRouter.get('/chat/:creatorId/:fanId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fanId = req.params.fanId as string;
    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.fanId, fanId),
      orderBy: [desc(messages.sentAt)],
      limit: 100,
    });
    res.json(chatMessages.reverse());
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Check se un fan è in takeover (usato dal worker)
export async function isFanInTakeover(creatorId: string, fanId: string): Promise<boolean> {
  const active = await db.query.humanTakeover.findFirst({
    where: and(
      eq(humanTakeover.creatorId, creatorId),
      eq(humanTakeover.fanId, fanId),
      eq(humanTakeover.isActive, true)
    ),
  });
  return !!active;
}