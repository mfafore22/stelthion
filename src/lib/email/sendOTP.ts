/**
 * OTP Email Sender
 * Sends two-factor authentication codes via SMTP (nodemailer).
 *
 * Required environment variables:
 *   SMTP_HOST   — e.g. smtp.gmail.com
 *   SMTP_PORT   — e.g. 587
 *   SMTP_SECURE — "true" for port 465, "false" for STARTTLS
 *   SMTP_USER   — SMTP login (sender address)
 *   SMTP_PASS   — SMTP password or app password
 *   SMTP_FROM   — Optional display name + address, e.g. "Stelthion Security <noreply@stelthion.com>"
 */

import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Masks an email address for display: "manager@ideapark.fi" → "m*****@ideapark.fi"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 1) return email;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 5))}@${domain}`;
}

/**
 * Sends an OTP email to the tenant's registered address.
 * In development (no SMTP config), logs the code to the console instead.
 */
export async function sendOTPEmail(
  to: string,
  code: string,
  mallDisplayName: string
): Promise<void> {
  // Dev fallback: no SMTP configured → log to console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(
      `\n📧 [OTP EMAIL — DEV MODE]\nTo: ${to}\nMall: ${mallDisplayName}\nCode: ${code}\nExpires in 10 minutes\n`
    );
    return;
  }

  const transport = createTransport();
  const from =
    process.env.SMTP_FROM || `"Stelthion Security" <${process.env.SMTP_USER}>`;

  await transport.sendMail({
    from,
    to,
    subject: `Your Stelthion verification code: ${code}`,
    text: [
      `Your sign-in verification code for ${mallDisplayName}:`,
      ``,
      `  ${code}`,
      ``,
      `This code expires in 10 minutes.`,
      `If you did not request this, please ignore this email.`,
    ].join('\n'),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <div style="margin-bottom: 32px;">
          <p style="font-size: 13px; color: #888; margin: 0 0 8px;">STELTHION PROPERTY INTELLIGENCE</p>
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0;">Sign-in verification</h1>
        </div>

        <p style="color: #444; line-height: 1.6; margin: 0 0 24px;">
          Enter this code to complete your sign-in to <strong>${mallDisplayName}</strong>:
        </p>

        <div style="background: #f4f3f1; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #1a1a1a; font-variant-numeric: tabular-nums;">
            ${code}
          </span>
        </div>

        <p style="font-size: 13px; color: #888; margin: 0 0 8px;">
          This code expires in <strong>10 minutes</strong>.
        </p>
        <p style="font-size: 13px; color: #888; margin: 0;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
