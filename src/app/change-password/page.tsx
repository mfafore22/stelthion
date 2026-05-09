'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { AuthPromptShell } from '@/components/auth/AuthPromptShell';
import { PasswordField } from '@/components/auth/PasswordField';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    fetch('/api/account/check-password')
      .then(r => r.json())
      .then(data => setIsFirstTime(!data.passwordChanged))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isFirstTime && !currentPassword) {
      setError('Current password is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: isFirstTime ? undefined : currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to change password');
        setLoading(false);
        return;
      }

      window.location.replace('/login');
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <AuthPromptShell title="Set your password" description="Please create a new password to continue.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>}
        {!isFirstTime && <PasswordField
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Enter your current password"
          autoComplete="current-password"
        />}
        <PasswordField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Saving...' : 'Set Password & Continue'}
        </button>
      </form>
    </AuthPromptShell>
  );
}
