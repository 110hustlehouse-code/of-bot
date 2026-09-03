import { api } from './api';

export async function login(email: string, password: string) {
  const res = await api.post('/api/auth/login', { email, password });
  localStorage.setItem('token', res.data.token);
  return res.data;
}

export async function register(name: string, email: string, password: string) {
  const res = await api.post('/api/auth/register', { name, email, password });
  localStorage.setItem('token', res.data.token);
  return res.data;
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}