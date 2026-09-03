import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const client = env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY })
  : null;

export interface VoiceNote {
  audioPath: string;
  durationSeconds: number;
  cleanup: () => void;
}

// Genera un voice note e salva in file temporaneo
export async function generateVoiceNote(
  text: string,
  voiceId: string // ID voce clonata della creator su ElevenLabs
): Promise<VoiceNote | null> {
  if (!client) {
    logger.warn('ElevenLabs not configured — skipping voice note');
    return null;
  }

  try {
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.85,
        style: 0.3,
        useSpeakerBoost: true,
      },
    });

    // Salva in file temporaneo
    const tmpPath = path.join(os.tmpdir(), `voice_${Date.now()}.mp3`);
    const chunks: Buffer[] = [];

    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }

    fs.writeFileSync(tmpPath, Buffer.concat(chunks));

    // Stima durata (circa 150 parole/minuto)
    const wordCount = text.split(' ').length;
    const durationSeconds = Math.ceil((wordCount / 150) * 60);

    logger.info(`Voice note generated: ${tmpPath} (~${durationSeconds}s)`);

    return {
      audioPath: tmpPath,
      durationSeconds,
      cleanup: () => {
        try { fs.unlinkSync(tmpPath); } catch {}
      },
    };
  } catch (err) {
    logger.error(`Voice note generation failed: ${err}`);
    return null;
  }
}

// Invia voice note via Playwright su OF
export async function sendVoiceNote(
  page: any,
  ofFanId: string,
  voiceNote: VoiceNote
): Promise<boolean> {
  try {
    await page.goto(`https://onlyfans.com/my/chats/chat/${ofFanId}`, {
      waitUntil: 'networkidle',
    });

    // Trova input file per audio
    const fileInput = await page.$('input[type="file"][accept*="audio"], input[type="file"]');
    if (!fileInput) {
      logger.warn('File input not found on OF chat page');
      return false;
    }

    await fileInput.setInputFiles(voiceNote.audioPath);
    await page.waitForTimeout(1000);

    // Invia
    const sendBtn = await page.$('button[type="submit"], button[aria-label*="send"], button[aria-label*="Send"]');
    if (sendBtn) {
      await sendBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.keyboard.press('Enter');
    }

    logger.info(`Voice note sent to fan ${ofFanId}`);
    return true;
  } catch (err) {
    logger.error(`Voice note send failed: ${err}`);
    return false;
  } finally {
    voiceNote.cleanup();
  }
}

// Decide se mandare voice note invece di testo (20% delle volte per fan hot/whale)
export function shouldSendVoiceNote(
  tier: string,
  heatScore: number,
  voiceId: string | null
): boolean {
  if (!voiceId || !client) return false;
  if (tier === 'whale') return heatScore > 60; // whale: voice note se abbastanza caldo
  if (tier === 'hot') return heatScore > 75 && Math.random() < 0.3; // hot: 30% delle volte
  return false;
}