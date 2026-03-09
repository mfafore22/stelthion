/**
 * Mall Property Manager Login Page
 * Secure authentication for property management companies
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MallLoginPage() {
  const router = useRouter();
  const { t } = useTranslation('mall');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/mall/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('login.loginFailed'));
        setLoading(false);
        return;
      }

      // Successful login - redirect based on company type
      const { mallId, companyName, isMultiProperty } = data;

      // Multi-property tenants go to their tenant portfolio page
      // Generate tenant slug dynamically from company name
      if (isMultiProperty) {
        const tenantSlug = companyName.toLowerCase().replace(/\s+/g, '-');
        router.push(`/tenant/${tenantSlug}/portfolio`);
      } else {
        // Single-property operators go directly to their mall detail page
        router.push(`/mall/${mallId}`);
      }
      setLoading(false);
    } catch (err) {
      setError(t('login.loginError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bo-neutral-50 to-bo-neutral-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/assets/brand/stelthion/Stelthion_synexis_brand.png"
              alt="Stelthion Synexis"
              width={200}
              height={60}
              priority
            />
          </div>
          <p className="mt-2 text-sm text-bo-neutral-600">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-bo-neutral-700 mb-2">
              <User className="inline h-4 w-4 mr-2" />
              {t('login.userId')}
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-bo-neutral-300 focus:ring-2 focus:ring-bo-primary-500 focus:border-transparent outline-none transition-all bg-white"
              placeholder={t('login.userIdPlaceholder')}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-bo-neutral-700 mb-2">
              <Lock className="inline h-4 w-4 mr-2" />
              {t('login.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-bo-neutral-300 focus:ring-2 focus:ring-bo-primary-500 focus:border-transparent outline-none transition-all bg-white"
              placeholder={t('login.passwordPlaceholder')}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-bo-neutral-950 text-white font-semibold hover:bg-bo-neutral-900 focus:ring-4 focus:ring-bo-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-bo-md"
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

        <div className="mt-6 text-center">
          <p className="text-xs text-bo-neutral-500">
            {t('login.authorizedOnly')}
          </p>
        </div>
      </Card>
    </div>
  );
}
