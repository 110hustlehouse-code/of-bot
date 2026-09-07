import { db } from '../../db/index.js';
import { mediaLibrary } from '../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { callLLM } from '../ai/llm-router.js';
import { logger } from '../../utils/logger.js';

export interface SelectedMedia {
  id: string;
  type: string;
  url: string;
  filename: string;
}

// Seleziona media contestuale alla conversazione
export async function selectMedia(
  creatorId: string,
  salesPhase: string,
  fanMessage: string,
  heatScore: number
): Promise<SelectedMedia | null> {
  const available = await db.query.mediaLibrary.findMany({
    where: eq(mediaLibrary.creatorId, creatorId),
  });

  if (available.length === 0) return null;

  // Mappa fase vendita → categoria media
  const categoryMap: Record<string, string[]> = {
    warmup: ['casual'],
    flirt: ['casual', 'teasing'],
    tease: ['teasing'],
    pitch: ['teasing', 'ppv'],
    upsell: ['explicit', 'ppv'],
    aftercare: ['casual', 'teasing'],
  };

  const preferredCategories = categoryMap[salesPhase] ?? ['casual'];

  // Filtra per categoria preferita
  let candidates = available.filter(m => 
    preferredCategories.includes(m.category ?? 'general')
  );

  // Fallback: qualsiasi media se nessun match
  if (candidates.length === 0) candidates = available;

  // Scegli random pesato per usage count basso (meno usato = più probabile)
  candidates.sort((a, b) => (a.usageCount ?? 0) - (b.usageCount ?? 0));
  const selected = candidates[0];

  // Aggiorna usage count
  await db.update(mediaLibrary)
    .set({ usageCount: (selected.usageCount ?? 0) + 1 })
    .where(eq(mediaLibrary.id, selected.id));

  logger.debug(`Media selected for ${salesPhase}: ${selected.filename}`);

  return {
    id: selected.id,
    type: selected.type,
    url: selected.url,
    filename: selected.filename,
  };
}

// Decide se inviare media con il messaggio
export function shouldSendMedia(
  heatScore: number,
  salesPhase: string,
  messageCount: number
): boolean {
  // Non inviare media nei primi messaggi
  if (messageCount < 3) return false;

  // Più il fan è caldo, più media
  if (salesPhase === 'pitch' || salesPhase === 'upsell') return heatScore > 50;
  if (salesPhase === 'tease') return heatScore > 40 && Math.random() < 0.4;
  if (salesPhase === 'flirt') return Math.random() < 0.2;

  return false;
}