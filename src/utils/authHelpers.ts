export const SYNTHETIC_EMAIL_DOMAIN = 'pitagoritas.local';

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
