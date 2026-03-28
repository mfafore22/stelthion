/**
 * OTP Store — in-memory store for pending two-factor authentication codes.
 */

import crypto from 'crypto';

interface OTPEntry {
  code: string;
  expiresAt: number;
  userId: string;
  mallId: string;
  companyName: string;
  mallDisplayName: string;
  isMultiProperty?: boolean;
  properties?: string[];
}

const otpStore = new Map<string, OTPEntry>();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateCode(): string {
  const num = crypto.randomBytes(4).readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, '0');
}

export function createPendingOTP(entry: Omit<OTPEntry, 'code' | 'expiresAt'>): {
  pendingToken: string;
  code: string;
} {
  const pendingToken = crypto.randomBytes(32).toString('hex');
  const code = generateCode();

  otpStore.set(pendingToken, {
    ...entry,
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  return { pendingToken, code };
}

export function verifyOTP(pendingToken: string, code: string): OTPEntry | null {
  const entry = otpStore.get(pendingToken);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(pendingToken);
    return null;
  }

  if (entry.code !== code) return null;

  otpStore.delete(pendingToken); // single-use
  return entry;
}

export function isPendingTokenValid(pendingToken: string): boolean {
  const entry = otpStore.get(pendingToken);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(pendingToken);
    return false;
  }
  return true;
}

// Cleanup expired entries every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [token, entry] of otpStore.entries()) {
      if (now > entry.expiresAt) otpStore.delete(token);
    }
  }, 15 * 60 * 1000);
}
