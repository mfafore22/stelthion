/**
 * Mall Property Manager Login Page
 * Two-step authentication: userId + password, then email OTP.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Lock, User, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Step = 'credentials' | 'otp';

export default function MallLoginPage() {
  const router = useRouter();
  const { t } = useTranslation('mall');

  // Step 1 state
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 state
  const [step, setStep] = useState<Step>('credentials');
  const [pendingToken, setPendingToken] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  }, [step]);

  // --- Step 1: Credentials ---
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/mall/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('login.loginFailed'));
        setLoading(false);
        return;
      }

      // DEMO_MODE — session created directly, redirect immediately
      if (data.success) {
        redirectAfterLogin(data);
        return;
      }

      // OTP required
      if (data.requiresOTP) {
        setPendingToken(data.pendingToken);
        setEmailHint(data.emailHint);
        setStep('otp');
        setLoading(false);
        return;
      }

      setError(t('login.loginFailed'));
      setLoading(false);
    } catch {
      setError(t('login.loginError'));
      setLoading(false);
    }
  };

  // --- Step 2: OTP ---
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const code = otp.join('');
    if (code.length !== 6) {
      setError(t('login.otp.incomplete'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/mall/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('login.otp.invalid'));
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        setLoading(false);
        return;
      }

      redirectAfterLogin(data);
    } catch {
      setError(t('login.loginError'));
      setLoading(false);
    }
  };

  function redirectAfterLogin(data: {
    mallId: string;
    companyName: string;
    isMultiProperty: boolean;
  }) {
    if (data.isMultiProperty) {
      const tenantSlug = data.companyName.toLowerCase().replace(/\s+/g, '-');
      router.push(`/tenant/${tenantSlug}/portfolio`);
    } else {
      router.push(`/mall/${data.mallId}`);
    }
  }

  // OTP input helpers
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // one digit per box
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 filled
    if (next.every(Boolean) && index === 5) {
      otpRefs.current[5]?.form?.requestSubmit();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Stelthion" width={200} height={64} priority />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'credentials' ? t('login.subtitle') : t('login.otp.title')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1 — Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                {t('login.userId')}
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder={t('login.userIdPlaceholder')}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline h-4 w-4 mr-2" />
                {t('login.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder={t('login.passwordPlaceholder')}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gray-950 text-white font-semibold hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('login.signingIn')}
                </span>
              ) : (
                t('login.signIn')
              )}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 'otp' && (
          <form onSubmit={handleOTPSubmit} className="space-y-6">
            {/* Email hint */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                {t('login.otp.sentTo', { email: emailHint })}
              </p>
            </div>

            {/* 6-digit input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <ShieldCheck className="inline h-4 w-4 mr-2" />
                {t('login.otp.label')}
              </label>
              <div className="flex gap-2 justify-between" onPaste={handleOTPPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    disabled={loading}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.some((d) => !d)}
              className="w-full py-3 px-4 rounded-lg bg-gray-950 text-white font-semibold hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('login.otp.verifying')}
                </span>
              ) : (
                t('login.otp.verify')
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(''); setOtp(['', '', '', '', '', '']); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              {t('login.otp.back')}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t('login.authorizedOnly')}
          </p>
        </div>
      </Card>
    </div>
  );
}
