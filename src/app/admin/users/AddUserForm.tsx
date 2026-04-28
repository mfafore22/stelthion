'use client';

import { useState } from 'react';
import { UserPlus, Mail, Check, AlertTriangle } from 'lucide-react';

interface Props {
  activeCustomer: { id: string; name: string } | null;
  onCreated: () => void;
}

export function AddUserForm({ activeCustomer, onCreated }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'USER' | 'MANAGER' | 'ADMIN'>('USER');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const customerId = activeCustomer?.id ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, customerId, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Welcome email sent to ${email}` });
        setEmail('');
        setName('');
        onCreated();
      } else {
        setResult({ ok: false, message: data.error || 'Failed to create user' });
      }
    } catch {
      setResult({ ok: false, message: 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-bo-neutral-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-bo-neutral-900 mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        Add New User
      </h2>

      {result && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 mb-4 ${
            result.ok
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {result.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@company.fi"
              className={inputClass}
            />
          </Field>
          <Field label="Full Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Matti Meikäläinen"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Customer">
            <p className="px-3 py-2 text-sm text-bo-neutral-700 bg-bo-neutral-100 rounded-lg">
              {activeCustomer?.name ?? 'Loading...'}
            </p>
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'USER' | 'MANAGER' | 'ADMIN')}
              className={inputClass}
            >
              <option value="USER">User</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
        </div>

        <button
          type="submit"
          disabled={submitting || !customerId}
          className="flex items-center gap-2 px-5 py-2.5 bg-bo-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-bo-neutral-800 transition-colors disabled:opacity-50"
        >
          <Mail className="w-4 h-4" />
          {submitting ? 'Creating...' : 'Create User & Send Welcome Email'}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-bo-neutral-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
