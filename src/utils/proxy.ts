import { env } from '../config/env.js';

export function getProxyConfig(): object | undefined {
  if (!env.OF_PROXY_URL) return undefined;
  return {
    server: env.OF_PROXY_URL,
    username: env.OF_PROXY_USER,
    password: env.OF_PROXY_PASS,
  };
}