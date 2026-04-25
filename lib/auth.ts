import { authFetch } from "@/lib/api";

const REMEMBER_ME_KEY = 'rememberMe';

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const res = await authFetch('/api/auth/me');
    return res.ok;
  } catch {
    return false;
  }
};

export const setRememberMe = (remember: boolean): void => {
  localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
};

export const getRememberMe = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
};
