'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerOption {
  id: string;
  name: string;
}

export function CustomerSelectorClient({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/select-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to select customer');
      }
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to select customer');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bo-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-bo-sm border border-bo-neutral-200 p-8">
        <h1 className="text-xl font-bold tracking-tight text-bo-neutral-950 mb-2">
          Select customer account
        </h1>
        <p className="text-sm text-bo-neutral-600 mb-6">
          Choose which tenant to administer. You can switch later from the sidebar.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-bo-neutral-700 mb-2">
          Customer
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={busy}
          className="w-full rounded-lg border border-bo-neutral-300 bg-white px-3 py-2.5 text-sm text-bo-neutral-950 focus:border-bo-primary-600 focus:outline-none focus:ring-2 focus:ring-bo-primary-600/20 disabled:opacity-50"
        >
          <option value="" disabled>
            Choose a customer…
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedId || busy}
          className="mt-6 w-full rounded-lg bg-bo-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bo-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Loading…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
