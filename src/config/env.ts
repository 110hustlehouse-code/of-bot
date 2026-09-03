import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  JWT_SECRET: z.string(),
  ENCRYPTION_KEY: z.string(),
  OF_PROXY_URL: z.string().optional(),
  OF_PROXY_USER: z.string().optional(),
  OF_PROXY_PASS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
