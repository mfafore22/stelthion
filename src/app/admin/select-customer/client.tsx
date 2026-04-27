'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight } from 'lucide-react';

interface CustomerOption {
  id: string;
  name: string;
}

export function CustomerSelectorClient({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(customerId: string) {
    setBusyId(customerId);
    setError(null);
    try {
      const res = await fetch('/api/admin/select-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to select customer');
      }
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to select customer');
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bo-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold tracking-tight text-bo-neutral-950 mb-2">
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

        <ul className="space-y-2">
          {customers.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handleSelect(c.id)}
                disabled={busyId !== null}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-bo-neutral-200 bg-white px-5 py-4 text-left transition-all hover:border-bo-primary-600 hover:shadow-bo-sm disabled:opacity-50 disabled:cursor-wait"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bo-neutral-100 flex items-center justify-center text-bo-neutral-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-bo-neutral-950">{c.name}</div>
                    <div className="text-xs text-bo-neutral-500">{c.id}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-bo-neutral-400" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
