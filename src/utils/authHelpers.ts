const DEFAULT_EMAIL_DOMAIN = 'pitagoritas-mail.com';

const envDomain = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SUPABASE_EMAIL_DOMAIN;

export const SYNTHETIC_EMAIL_DOMAIN = envDomain && envDomain.trim().length > 0 ? envDomain.trim().toLowerCase() : DEFAULT_EMAIL_DOMAIN;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9]{3,15}$/.test(username);
}

export function buildSyntheticEmail(username: string): string {
  return `${username}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
