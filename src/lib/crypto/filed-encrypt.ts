import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key) throw new Error('FIELD_ENCRYPTION_KEY not set');
  return Buffer.from(key, 'base64');
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(b => b.toString('base64')).join(':');
}

export function decrypt(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64')) as crypto.DecipherGCM;
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}