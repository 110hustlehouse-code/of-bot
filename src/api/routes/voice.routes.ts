import { Router, Response } from 'express';
import multer from 'multer';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { db } from '../../db/index.js';
import { creators } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';

export const voiceRouter = Router();
voiceRouter.use(authMiddleware);

const upload = multer({ dest: '/tmp/aura-uploads/' });

voiceRouter.post('/clone/:creatorId', upload.single('audio'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;

    if (!req.file) {
      res.status(400).json({ error: 'Audio file required' });
      return;
    }

    if (!env.ELEVENLABS_API_KEY) {
      res.status(400).json({ error: 'ElevenLabs not configured' });
      return;
    }

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });

    if (!creator) {
      res.status(404).json({ error: 'Creator not found' });
      return;
    }

    const client = new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });

    // Clona voce su ElevenLabs
    const voice = await client.voices.ivc.create({
      
      name: `Aura_${creator.name}_${Date.now()}`, files: [fs.createReadStream(req.file.path) as any],
      description: `Cloned voice for ${creator.name}`,
    });

    // Salva Voice ID nel DB
    await db.update(creators)
      .set({ elevenLabsVoiceId: voice.voiceId })
      .where(eq(creators.id, creatorId));

    // Rimuovi file temporaneo
    fs.unlinkSync(req.file.path);

    logger.info(`Voice cloned for creator ${creatorId}: ${voice.voiceId}`);
    res.json({ voiceId: voice.voiceId, name: voice.voiceId });
  } catch (err) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    logger.error(`Voice clone error: ${err}`);
    res.status(500).json({ error: `${err}` });
  }
});

voiceRouter.delete('/clone/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });

    if (!creator?.elevenLabsVoiceId) {
      res.status(404).json({ error: 'No voice found' });
      return;
    }

    const client = new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY! });
    await client.voices.delete(creator.elevenLabsVoiceId);

    await db.update(creators)
      .set({ elevenLabsVoiceId: null })
      .where(eq(creators.id, creatorId));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});