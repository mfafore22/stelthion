'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MallLoginPage() {
  const { t } = useTranslation('mall');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        setError(t('login.loginFailed', 'Invalid email or password'));
        setLoading(false);
        return;
      }

      // Mark as mall login so two-factor page redirects correctly
      sessionStorage.setItem('login-destination', 'mall');
      window.location.replace('/two-factor');
    } catch {
      setError(t('login.loginError', 'Login failed. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/stelthion-brandmark.png" alt="Stelthion" width={96} height={96} priority />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {t('login.subtitle', 'Property Manager Secure Login')}
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-2" />
              {t('login.userId', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white"
              placeholder={t('login.userIdPlaceholder', 'Enter your email')}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline h-4 w-4 mr-2" />
              {t('login.password', 'Password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white"
              placeholder={t('login.passwordPlaceholder', 'Enter your password')}
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
                {t('login.signingIn', 'Signing in...')}
              </span>
            ) : (
              t('login.signIn', 'Sign In')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t('login.authorizedOnly', 'Secure access for authorized personnel only')}
          </p>
        </div>
      </div>
    </div>
  );
}