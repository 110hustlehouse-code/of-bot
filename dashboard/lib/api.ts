import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://of-bot-production.up.railway.app';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Agency {
  id: string;
  name: string;
  email: string;
}

export interface Creator {
  id: string;
  name: string;
  ofUsername: string;
  personaPrompt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Fan {
  id: string;
  displayName: string;
  tier: string;
  totalSpent: number;
  messageCount: number;
  emotionalState: string;
  ppvConversionRate: number;
  lastActive: string;
}

export interface Analytics {
  fanStats: { totalFans: number; totalRevenue: number; avgSpend: number };
  msgStats: { totalMessages: number; aiMessages: number };
  ppvStats: { totalSent: number; totalPurchased: number; conversionRate: number };
}