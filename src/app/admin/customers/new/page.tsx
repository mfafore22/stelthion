'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { parsePlanFeatures } from '@/lib/plan-gate';

interface Plan {
  id: string;
  name: string;
  priceMonthly: number | null;
  features: unknown;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = ['Company', 'Plan', 'First Mall', 'Invite User'];

export default function NewCustomerPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [companyName, setCompanyName] = useState('');
  // Step 2
  const [planId, setPlanId] = useState('');
  // Step 3
  const [mallName, setMallName] = useState('');
  const [mallCity, setMallCity] = useState('');
  const [mallSlug, setMallSlug] = useState('');
  const [marketId, setMarketId] = useState('');
  const [skipMall, setSkipMall] = useState(false);
  // Step 4
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [skipInvite, setSkipInvite] = useState(false);

  // Created IDs
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    fetch('/api/admin/plans')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setPlans(d); });
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, 4) as Step);
  const back = () => setStep((s) => Math.max(s - 1, 1) as Step);

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    try {
      // Create customer
      const custRes = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, planId: planId || null }),
      });
      if (!custRes.ok) throw new Error((await custRes.json()).error ?? 'Failed to create customer');
      const cust = await custRes.json();
      const cId = cust.id;
      setCustomerId(cId);

      // Create mall if not skipped
      if (!skipMall && mallSlug && mallName && mallCity) {
        const mallRes = await fetch(`/api/admin/customers/${cId}/malls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mallId: mallSlug, name: mallName, city: mallCity, marketId: marketId || null }),
        });
        if (!mallRes.ok) throw new Error((await mallRes.json()).error ?? 'Failed to create mall');
      }

      // Invite user if not skipped
      if (!skipInvite && inviteEmail && inviteName) {
        const userRes = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail, name: inviteName, customerId: cId, role: 'MANAGER' }),
        });
        if (!userRes.ok) {
          const d = await userRes.json();
          if (d.error && !d.error.includes('already exists')) throw new Error(d.error);
        }
      }

      router.push('/admin/customers');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">New Customer</h1>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step;
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done ? 'bg-green-500 text-white' : active ? 'bg-bo-neutral-950 text-white' : 'bg-bo-neutral-200 text-bo-neutral-500'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-bo-neutral-900' : 'text-bo-neutral-400'}`}>{label}</span>
              {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-bo-neutral-300 mx-1" />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-bo-neutral-200 p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-bo-neutral-900">Company details</h2>
            <div>
              <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Company name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Kiinteistö Oy Kauppakeskus Ab"
                className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500"
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-bo-neutral-900">Select a plan</h2>
            <div className="space-y-3">
              {plans.map((p) => {
                const f = parsePlanFeatures(p.features);
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      planId === p.id ? 'border-bo-primary-500 bg-bo-primary-50/30' : 'border-bo-neutral-200 hover:border-bo-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={planId === p.id}
                      onChange={() => setPlanId(p.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-bo-neutral-900">{p.name}</span>
                        <span className="text-sm text-bo-neutral-500">
                          {p.priceMonthly != null ? `€${p.priceMonthly}/mo` : 'Custom'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {f.shoppermind && <span className="text-[10px] font-medium text-blue-600">ShopperMind</span>}
                        {f.edgeVision && <span className="text-[10px] font-medium text-green-600">Edge Vision</span>}
                        {f.concierge && <span className="text-[10px] font-medium text-purple-600">Concierge</span>}
                        <span className="text-[10px] text-bo-neutral-400">Up to {f.maxMalls} mall{f.maxMalls !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
              <button
                type="button"
                onClick={() => setPlanId('')}
                className="text-xs text-bo-neutral-400 underline"
              >
                Skip — assign plan later
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-bo-neutral-900">First mall</h2>
            {!skipMall ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Mall name</label>
                    <input type="text" value={mallName} onChange={(e) => setMallName(e.target.value)}
                      placeholder="City Centre" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-bo-neutral-700 mb-1">City</label>
                    <input type="text" value={mallCity} onChange={(e) => setMallCity(e.target.value)}
                      placeholder="Helsinki" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Mall ID (slug)</label>
                  <input type="text" value={mallSlug} onChange={(e) => setMallSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="city-centre-fi" className={inputCls} />
                  <p className="text-xs text-bo-neutral-400 mt-1">Lowercase, hyphens only. Cannot be changed later.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-bo-neutral-700 mb-1">ShopperMind Market ID</label>
                  <input type="text" value={marketId} onChange={(e) => setMarketId(e.target.value)}
                    placeholder="helsinki-fi" className={inputCls} />
                  <p className="text-xs text-bo-neutral-400 mt-1">Leave blank if ShopperMind is not used for this mall.</p>
                </div>
              </>
            ) : null}
            <button type="button" onClick={() => setSkipMall(!skipMall)}
              className="text-xs text-bo-neutral-400 underline">
              {skipMall ? 'Add a mall now' : 'Skip — add malls later'}
            </button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-bo-neutral-900">Invite first user</h2>
            {!skipInvite ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Name</label>
                  <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Matti Meikäläinen" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Email</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="matti@company.fi" className={inputCls} />
                </div>
              </>
            ) : null}
            <button type="button" onClick={() => setSkipInvite(!skipInvite)}
              className="text-xs text-bo-neutral-400 underline">
              {skipInvite ? 'Invite a user now' : 'Skip — invite users later'}
            </button>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-bo-neutral-600 border border-bo-neutral-200 rounded-lg hover:bg-bo-neutral-50 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            disabled={step === 1 && !companyName.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-bo-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-bo-neutral-800 disabled:opacity-30 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {submitting ? 'Creating...' : 'Create Customer'}
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500';
