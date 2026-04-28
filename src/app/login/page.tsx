'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, AlertCircle, User } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [mode, setMode] = useState<'choose' | 'admin' | 'mall'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // LOCAL ONLY — DO NOT COMMIT TO GITHUB
      // NextAuth v5 returns { url } not { ok, error } when redirect: false.
      // A failed login url contains '/api/auth/error'; success url is the callbackUrl.
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      const failed = !result?.url || result.url.includes('/api/auth/error');
      if (failed) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (mode === 'mall') {
        sessionStorage.setItem('login-destination', 'mall');
      } else {
        sessionStorage.setItem('login-destination', 'admin');
      }

      window.location.replace('/two-factor');
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen w-full overflow-hidden pt-[20vh]">
      <Image
        src="/Stelthion_landing-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center -z-10"
      />
      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 px-10 pt-8 pb-8">

          <div className="flex flex-col items-center mb-4">
            <Image
              src="/logo.png"
              alt="Stelthion"
              width={360}
              height={98}
              priority
              className="h-auto w-[200px] sm:w-[260px] md:w-[320px] lg:w-[360px]"
            />
            <p className="-mt-1 w-[200px] translate-x-[5px] text-center text-sm font-medium uppercase tracking-[0.30em] text-bo-neutral-800 sm:w-[260px] sm:translate-x-[6px] sm:text-base sm:tracking-[0.34em] md:w-[320px] md:translate-x-[7px] md:text-lg md:tracking-[0.38em] lg:w-[360px] lg:translate-x-[8px] lg:text-xl lg:tracking-[0.42em]">
              PropertyOS
              <sup className="ml-0.5 align-super text-[0.45em] tracking-normal">
                TM
              </sup>
            </p>
          </div>

          {mode === 'choose' && (
            <>
              <p className="text-center text-sm text-gray-500 mb-8 font-medium">
                Property Manager Secure Login
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setMode('mall')}
                  className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
                >
                  Property Login
                </button>
                <button
                  onClick={() => setMode('admin')}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  Admin Login
                </button>
              </div>
            </>
          )}

          {(mode === 'admin' || mode === 'mall') && (
            <>
              <p className="text-center text-sm text-gray-500 mb-8 font-medium">
                {mode === 'admin' ? 'Admin Access' : 'Mall Property Access'}
              </p>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                    <User size={14} className="text-gray-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                    <Lock size={14} className="text-gray-400" />
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <button
                onClick={() => { setMode('choose'); setError(''); setEmail(''); setPassword(''); }}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors text-center"
              >
                ← Back
              </button>
            </>
          )}

          <p className="text-center text-xs text-gray-400 mt-8">
            Secure access for authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}