'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/hooks';
import i18n from '@/lib/i18n';
import { CompactLanguageSelector } from '@/components/ui/language-selector';
import { LogOut, KeyRound } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function AdminHeader() {
  const { t } = useTranslation('admin');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('stelthion-language');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/changepassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to change password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccess(false);
      }, 2000);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setError('');
    setSuccess(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      <header className="h-[80px] bg-glass border-b-[4px] border-bo-neutral-700/50 shadow-bo-sm flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/stelthion-brandmark.png"
            alt="Stelthion"
            width={220}
            height={60}
            className="object-contain"
            priority
          />
          <div className="w-px h-8 bg-bo-neutral-300" />
          <span className="text-sm font-semibold text-bo-neutral-600 tracking-wide">Admin Tool</span>
        </div>

        <div className="flex items-center gap-4">
          <CompactLanguageSelector />
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 text-sm text-bo-neutral-600 hover:text-bo-neutral-900 transition-colors"
          >
            <KeyRound size={16} />
            <span>{t('header.changePassword', 'Change Password')}</span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-bo-lg p-6 max-w-sm w-full mx-4 border border-bo-neutral-200">
            <h3 className="text-lg font-bold text-bo-neutral-950 mb-4">{t('header.changePassword', 'Change Password')}</h3>

            {success ? (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                Password changed successfully!
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-sm text-bo-neutral-600 mb-1 block">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-600/20 focus:border-bo-primary-600"
                  />
                </div>
                <div>
                  <label className="text-sm text-bo-neutral-600 mb-1 block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-600/20 focus:border-bo-primary-600"
                  />
                </div>
                <div>
                  <label className="text-sm text-bo-neutral-600 mb-1 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-600/20 focus:border-bo-primary-600"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-bo-neutral-950 text-white hover:bg-bo-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}