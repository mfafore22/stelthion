'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Store, Check, Loader2, ChevronLeft } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500';

export default function AddMallPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [slug, setSlug] = useState('');
  const [marketId, setMarketId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/malls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId: slug, name, city, marketId: marketId || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create mall');
      router.push('/admin/customers');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim() && city.trim() && slug.trim() && !submitting;

  return (
    <div className="p-6 max-w-xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-bo-neutral-500 hover:text-bo-neutral-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex items-center gap-3 mb-6">
        <Store className="w-6 h-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">Add Mall</h1>
      </div>

      <div className="bg-white rounded-xl border border-bo-neutral-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Mall name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sello" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-bo-neutral-700 mb-1">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Espoo" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Mall ID (slug)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="sello-espoo"
            className={inputCls}
          />
          <p className="text-xs text-bo-neutral-400 mt-1">Lowercase, hyphens only. Cannot be changed later.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-bo-neutral-700 mb-1">ShopperMind Market ID</label>
          <input type="text" value={marketId} onChange={(e) => setMarketId(e.target.value)} placeholder="espoo-fi" className={inputCls} />
          <p className="text-xs text-bo-neutral-400 mt-1">Leave blank if ShopperMind is not used for this mall.</p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {submitting ? 'Creating...' : 'Create Mall'}
          </button>
        </div>
      </div>
    </div>
  );
}
