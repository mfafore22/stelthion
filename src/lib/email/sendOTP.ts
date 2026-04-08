import prisma from '@/app/lib/prisma'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

// ─── Helpers ────────────────────────────────────────────────

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 1) return email;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 5))}@${domain}`;
}

function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// ─── OTP (2FA verification) ─────────────────────────────────

export async function generateAndSendOTP(email: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent duplicate sends within 30 seconds
    const recentOtp = await prisma.emailOtp.findFirst({
      where: {
        email,
        used: false,
        createdAt: { gt: new Date(Date.now() - 30 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      return;
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailOtp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.emailOtp.create({
      data: { email, code, expiresAt },
    });

    if (!process.env.RESEND_API_KEY) {
      console.log(`\n📧 [OTP DEV MODE]\nTo: ${email}\nCode: ${code}\nExpires in 10 minutes\n`);
      return;
    }

    const from = process.env.OTP_FROM_EMAIL || 'noreply@stelthion.com';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Stelthion <${from}>`,
        to: [email],
        subject: `Your Stelthion verification code: ${code}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <p style="font-size: 13px; color: #888; letter-spacing: 1px;">STELTHION PROPERTYOS</p>
            <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 8px;">Sign-in verification</h1>
            <p style="color: #444;">Enter this code to complete your sign-in:</p>
            <div style="background: #f4f3f1; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0;">
              <span style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #1a1a1a;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #888;">This code expires in <strong>10 minutes</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 11px; color: #aaa;">Stelthion PropertyOS — Mall Analytics Platform</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error('Failed to send OTP:', await res.text());
      throw new Error('Failed to send verification email');
    }
  } catch (error) {
    console.error('OTP generation error:', error);
    throw error;
  }
}

// ─── OTP Verification ───────────────────────────────────────

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  try {
    const otp = await prisma.emailOtp.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return false;

    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    return true;
  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
}

// ─── Welcome Email (new user account) ───────────────────────

export async function createUserAndSendWelcome({
  email,
  name,
  customerId,
  role = 'USER',
}: {
  email: string;
  name: string;
  customerId: string;
  role?: 'ADMIN' | 'MANAGER' | 'USER';
}): Promise<{ userId: string; password: string }> {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        customerId,
      },
    });

    if (!process.env.RESEND_API_KEY) {
      console.log(`\n📧 [WELCOME EMAIL DEV MODE]`);
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Password: ${plainPassword}`);
      console.log(`Customer: ${customerId}\n`);
      return { userId: user.id, password: plainPassword };
    }

    const fromEmail = process.env.WELCOME_FROM_EMAIL || 'accounts@stelthion.com';
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stelthion.com';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Stelthion <${fromEmail}>`,
        to: [email],
        subject: 'Tervetuloa Stelthion PropertyOS-käyttäjäksi',
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <p style="font-size: 13px; color: #888; letter-spacing: 1px;">STELTHION PROPERTYOS</p>
            
            <h1 style="font-size: 22px; color: #1a1a1a; margin-top: 8px;">
              Tervetuloa käyttämään Stelthion PropertyOS-palvelua!
            </h1>
            
            <p style="color: #444; line-height: 1.6;">
              Seuraavan linkin kautta pääset kirjautumaan:
            </p>
            
            <div style="margin: 20px 0;">
              <a href="${loginUrl}/login" 
                 style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                Kirjaudu sisään
              </a>
            </div>
            
            <p style="color: #444; line-height: 1.6;">
              Käyttäjätunnuksesi on sähköpostiosoitteesi.
            </p>
            
            <div style="background: #f4f3f1; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="font-size: 13px; color: #666; margin: 0 0 4px 0;">Sähköposti:</p>
              <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">${email}</p>
              <p style="font-size: 13px; color: #666; margin: 0 0 4px 0;">Salasanasi:</p>
              <p style="font-size: 16px; font-weight: 700; color: #1a1a1a; letter-spacing: 1px; margin: 0; font-family: monospace;">${plainPassword}</p>
            </div>
            
            <p style="color: #444; line-height: 1.6; font-size: 14px;">
              Jokainen kirjautuminen vaatii kaksivaiheisen tunnistautumisen. Koodi lähetetään sinulle sähköpostitse.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />
            
            <p style="font-size: 13px; color: #888;">
              Ystävällisesti,<br />
              Stelthion-tiimi
            </p>
            
            <p style="font-size: 11px; color: #aaa; margin-top: 16px;">Stelthion PropertyOS — Mall Analytics Platform</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error('Failed to send welcome email:', await res.text());
    }

    return { userId: user.id, password: plainPassword };
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}