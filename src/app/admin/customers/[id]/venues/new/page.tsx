'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, ChevronLeft, Landmark, Loader2 } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500';

export default function AddVenuePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [slug, setSlug] = useState('');
  const [country, setCountry] = useState('FI');
  const [capacity, setCapacity] = useState('15000');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId: slug, name, city, country, capacity: Number(capacity) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create venue');
      router.push('/admin/customers');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim() && city.trim() && slug.trim() && Number(capacity) > 0 && !submitting;

  return (
    <div className="p-6 max-w-xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-bo-neutral-500 hover:text-bo-neutral-800 mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex items-center gap-3 mb-6">
        <Landmark className="w-6 h-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">Add Venue</h1>
      </div>
      <div className="bg-white rounded-xl border border-bo-neutral-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Venue name" value={name} onChange={setName} placeholder="Nokia Arena" />
          <Field label="City" value={city} onChange={setCity} placeholder="Tampere" />
        </div>
        <Field
          label="Venue ID (slug)"
          value={slug}
          onChange={(value) => setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="nokia-arena"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country code" value={country} onChange={setCountry} placeholder="FI" />
          <Field label="Capacity" value={capacity} onChange={setCapacity} placeholder="15000" />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {submitting ? 'Creating...' : 'Create Venue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return <div><label className="block text-sm font-medium text-bo-neutral-700 mb-1">{label}</label><input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} /></div>;
}
