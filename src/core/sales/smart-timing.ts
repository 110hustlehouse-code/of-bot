import { db } from '../../db/index.js';
import { fans, messages } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { FanMemory } from '../ai/memory-engine.js';

export interface HeatScore {
  score: number;        // 0-100
  isHot: boolean;       // true se sopra soglia PPV
  signals: string[];    // debug: quali segnali hanno contribuito
}

const PPV_THRESHOLD = 65;

export function calculateHeatScore(
  memory: FanMemory,
  recentMessage: string,
  messagesSentToday: number,
  avgResponseTimeMinutes: number
): HeatScore {
  let score = 0;
  const signals: string[] = [];

  // Tier base
  const tierScores: Record<string, number> = {
    cold: 0, warm: 15, hot: 30, whale: 45,
  };
  score += tierScores[memory.tier] ?? 0;
  if (memory.tier !== 'cold') signals.push(`tier:${memory.tier}`);

  // Risposta veloce = fan coinvolto
  if (avgResponseTimeMinutes < 2) {
    score += 20;
    signals.push('fast_responder');
  } else if (avgResponseTimeMinutes < 10) {
    score += 10;
    signals.push('moderate_responder');
  }

  // Messaggio lungo = fan investito emotivamente
  const msgLength = recentMessage.length;
  if (msgLength > 200) {
    score += 15;
    signals.push('long_message');
  } else if (msgLength > 80) {
    score += 8;
    signals.push('medium_message');
  }

  // Emoji calde nel messaggio
  const hotEmojis = /[🔥💦😍🥵❤️‍🔥💋😘🍆]/u;
  if (hotEmojis.test(recentMessage)) {
    score += 15;
    signals.push('hot_emojis');
  }

  // Parole ad alta intenzione
  const highIntentWords = /\b(want|need|love|miss|send|show|pic|video|more|please|buy)\b/i;
  if (highIntentWords.test(recentMessage)) {
    score += 10;
    signals.push('high_intent_words');
  }

  // Fan attivo oggi (molti messaggi = session attiva)
  if (messagesSentToday >= 5) {
    score += 10;
    signals.push('active_session');
  }

  // Alto conversion rate storico
  if (memory.ppvConversionRate > 0.5) {
    score += 15;
    signals.push('high_converter');
  } else if (memory.ppvConversionRate > 0.2) {
    score += 7;
    signals.push('moderate_converter');
  }

  // Cap a 100
  score = Math.min(score, 100);

  return {
    score,
    isHot: score >= PPV_THRESHOLD,
    signals,
  };
}

// Aggiorna tier fan in base allo spending
export function calculateTier(totalSpent: number): string {
  if (totalSpent >= 500) return 'whale';
  if (totalSpent >= 100) return 'hot';
  if (totalSpent >= 20) return 'warm';
  return 'cold';
}

export async function updateFanTier(fanDbId: string, totalSpent: number): Promise<void> {
  const tier = calculateTier(totalSpent);
  await db.update(fans).set({ tier }).where(eq(fans.id, fanDbId));
}