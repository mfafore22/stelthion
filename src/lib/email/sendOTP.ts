import prisma from '@/app/lib/prisma'

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 1) return email;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 5))}@${domain}`;
}

export async function generateAndSendOTP(email: string): Promise<void> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
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
      from: `Stelthion Security <${from}>`,
      to: [email],
      subject: `Your Stelthion verification code: ${code}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <p style="font-size: 13px; color: #888;">STELTHION PROPERTY INTELLIGENCE</p>
          <h1 style="font-size: 24px; color: #1a1a1a;">Sign-in verification</h1>
          <p style="color: #444;">Enter this code to complete your sign-in:</p>
          <div style="background: #f4f3f1; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #1a1a1a;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #888;">This code expires in <strong>10 minutes</strong>.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error('Failed to send OTP:', await res.text());
    throw new Error('Failed to send verification email');
  }
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
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
}