/**
 * OTP Store — in-memory store for pending two-factor authentication codes.
 * Each entry is keyed by a short-lived pending token returned to the client
 * after successful password validation.
 */

import crypto from 'crypto';

interface OTPEntry {
  code: string;
  expiresAt: number;
  // Session data carried forward to create the full session after OTP verification
  userId: string;
  mallId: string;
  companyName: string;
  mallDisplayName: string;
  isMultiProperty?: boolean;
  properties?: string[];
}

const otpStore = new Map<string, OTPEntry>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates a cryptographically random 6-digit numeric OTP.
 */
function generateCode(): string {
  const num = crypto.randomBytes(4).readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, '0');
}

/**
 * Creates a new pending OTP entry and returns the opaque pending token
 * (sent to client) and the plaintext code (sent via email).
 */
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

/**
 * Verifies an OTP code against a pending token.
 * Returns the stored entry on success, null on failure/expiry.
 * The entry is deleted after a successful verification (single-use).
 */
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

/**
 * Checks if a pending token exists and is not expired (for UX validation).
 */
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
