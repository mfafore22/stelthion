'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
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
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Force full page reload so middleware picks up the new session cookie
      window.location.replace('/admin/dashboard');
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">

      {!showAdminLogin ? (
        <>
          <p className="text-sm font-medium tracking-widest uppercase text-gray-400">
            Property Manager Access
          </p>

          <div className="flex flex-col gap-4 items-center">
            <Link
              href="/mall/login"
              className="px-8 py-3 bg-gray-950 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors w-56 text-center"
            >
              Mall Login
            </Link>

            <button
              onClick={() => setShowAdminLogin(true)}
              className="px-8 py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors w-56 text-center"
            >
              Admin Login
            </button>
          </div>
        </>
      ) : (
        <div className="w-full max-w-sm">
          <p className="text-sm font-medium tracking-widest uppercase text-gray-400 text-center mb-6">
            Admin Access
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="admin@stelthion.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                <Lock className="inline h-4 w-4 mr-1" />
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gray-950 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => { setShowAdminLogin(false); setError(''); }}
            className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors text-center"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}
