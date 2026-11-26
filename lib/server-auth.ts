import crypto from 'node:crypto';
import { NextRequest } from 'next/server';

const globalForAuth = globalThis as typeof globalThis & {
  __nottpaySessionSecret?: string;
};

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (!globalForAuth.__nottpaySessionSecret) {
    globalForAuth.__nottpaySessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForAuth.__nottpaySessionSecret;
}

export function normalizePhoneNumber(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, '');
  if (!cleaned) return null;

  // Normalize Bangladeshi mobile numbers (+8801XXXXXXXXX / 8801XXXXXXXXX / 01XXXXXXXXX)
  if (/^\+?8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned.replace(/^\+?880/, '0');
  }
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // Fallback for general international phone numbers (8-15 digits)
  if (/^\+?[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  return null;
}

export function toE164PhoneNumber(input: string): string | null {
  const normalized = normalizePhoneNumber(input);
  if (!normalized) return null;
  if (/^01[3-9]\d{8}$/.test(normalized)) {
    return `+88${normalized}`;
  }
  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}

export function formatPhoneDisplay(normalizedPhone: string): string {
  if (/^01\d{9}$/.test(normalizedPhone)) {
    return `+880 ${normalizedPhone.slice(1, 5)}-${normalizedPhone.slice(5)}`;
  }
  return normalizedPhone;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function hashPin(pin: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string
): boolean {
  const derived = crypto.scryptSync(pin, salt, 64);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

interface SessionPayload {
  sub: string;
  phone: string;
  exp: number;
}

export function signSessionToken(userId: string, phone: string): string {
  const payload: SessionPayload = {
    sub: userId,
    phone,
    exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url'
  );
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

export function verifySessionToken(
  token: string
): { userId: string; phone: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (!parsed.sub || !parsed.phone || typeof parsed.exp !== 'number') {
      return null;
    }
    if (parsed.exp < Date.now()) {
      return null;
    }
    return { userId: parsed.sub, phone: parsed.phone };
  } catch {
    return null;
  }
}

export function getAuthenticatedSession(
  req: NextRequest
): { userId: string; phone: string } | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  return verifySessionToken(token);
}
