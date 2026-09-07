import { Router, Response } from 'express';
import multer from 'multer';
import { db } from '../../db/index.js';
import { mediaLibrary } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';

export const mediaRouter = Router();
mediaRouter.use(authMiddleware);

const upload = multer({ 
  dest: '/tmp/aura-media/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// Lista media per creator
mediaRouter.get('/:creatorId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const media = await db.query.mediaLibrary.findMany({
      where: eq(mediaLibrary.creatorId, creatorId),
    });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// Upload media
mediaRouter.post('/:creatorId', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId as string;
    const { category, tags } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'File required' });
      return;
    }

    // Determina tipo dal mimetype
    let type = 'photo';
    if (req.file.mimetype.startsWith('video/')) type = 'video';
    if (req.file.mimetype.startsWith('audio/')) type = 'audio';

    // Per produzione: upload su Supabase Storage o S3
    // Per ora salviamo il path locale
    const url = `/media/${req.file.filename}`;

    const [media] = await db.insert(mediaLibrary).values({
      creatorId,
      type,
      url,
      filename: req.file.originalname,
      category: category ?? 'general',
      tags: tags ? JSON.parse(tags) : [],
    }).returning();

    logger.info(`Media uploaded for creator ${creatorId}: ${req.file.originalname}`);
    res.status(201).json(media);
  } catch (err) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: `${err}` });
  }
});

// Delete media
mediaRouter.delete('/:creatorId/:mediaId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mediaId = req.params.mediaId as string;
    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, mediaId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});