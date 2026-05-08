'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tag, Plus, Save, Check } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  priceMonthly: number | null;
  features: unknown;
}

interface PlanFeatures {
  shoppermind: boolean;
  edgeVision: boolean;
  concierge: boolean;
  spaceAllocation: boolean;
  maxMalls: number;
}

const FEATURE_KEYS: Array<{ key: keyof Omit<PlanFeatures, 'maxMalls'>; label: string; hint: string }> = [
  { key: 'shoppermind', label: 'ShopperMind', hint: 'Trends, predictions, signal of the day' },
  { key: 'edgeVision', label: 'Edge Vision', hint: 'On-device camera analysis pipeline' },
  { key: 'concierge', label: 'Concierge', hint: 'Operator AI assistant' },
  { key: 'spaceAllocation', label: 'Space Optimizer', hint: 'Trend-driven rental-space recommendations' },
];

function emptyFeatures(): PlanFeatures {
  return {
    shoppermind: false,
    edgeVision: false,
    concierge: false,
    spaceAllocation: false,
    maxMalls: 1,
  };
}

function readFeatures(raw: unknown): PlanFeatures {
  const f = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    shoppermind: Boolean(f.shoppermind),
    edgeVision: Boolean(f.edgeVision),
    concierge: Boolean(f.concierge),
    spaceAllocation: Boolean(f.spaceAllocation),
    maxMalls: typeof f.maxMalls === 'number' ? f.maxMalls : 1,
  };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, PlanFeatures>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newPlan, setNewPlan] = useState<{ name: string; priceMonthly: string; features: PlanFeatures }>({
    name: '',
    priceMonthly: '',
    features: emptyFeatures(),
  });

  useEffect(() => {
    fetch('/api/admin/plans')
      .then((r) => r.json())
      .then((data: Plan[]) => {
        if (!Array.isArray(data)) return;
        setPlans(data);
        setDrafts(Object.fromEntries(data.map((p) => [p.id, readFeatures(p.features)])));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'load failed'))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const p of plans) {
      const original = readFeatures(p.features);
      const draft = drafts[p.id];
      if (!draft) continue;
      out[p.id] =
        draft.shoppermind !== original.shoppermind ||
        draft.edgeVision !== original.edgeVision ||
        draft.concierge !== original.concierge ||
        draft.spaceAllocation !== original.spaceAllocation ||
        draft.maxMalls !== original.maxMalls;
    }
    return out;
  }, [plans, drafts]);

  function updateDraft(planId: string, patch: Partial<PlanFeatures>) {
    setDrafts((prev) => ({ ...prev, [planId]: { ...prev[planId], ...patch } }));
  }

  async function savePlan(plan: Plan) {
    setSavingId(plan.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: drafts[plan.id] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as Plan;
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
      setDrafts((prev) => ({ ...prev, [plan.id]: readFeatures(updated.features) }));
      setSavedAt((prev) => ({ ...prev, [plan.id]: Date.now() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'save failed');
    } finally {
      setSavingId(null);
    }
  }

  async function createPlan() {
    if (!newPlan.name.trim()) return;
    setSavingId('__new__');
    setError(null);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlan.name.trim(),
          priceMonthly: newPlan.priceMonthly ? Number(newPlan.priceMonthly) : null,
          features: newPlan.features,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const created = (await res.json()) as Plan;
      setPlans((prev) => [...prev, created]);
      setDrafts((prev) => ({ ...prev, [created.id]: readFeatures(created.features) }));
      setNewPlan({ name: '', priceMonthly: '', features: emptyFeatures() });
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'create failed');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-bo-primary-600" />
          <h1 className="text-xl font-bold text-bo-neutral-900">Plans</h1>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-bo-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-bo-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Cancel' : 'New Plan'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {creating && (
        <div className="mb-6 bg-white rounded-xl border border-bo-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-bo-neutral-900 mb-3">New plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input
              value={newPlan.name}
              onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
              placeholder="Plan name (e.g. Realidea Suite)"
              className="px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-bo-primary-600"
            />
            <input
              value={newPlan.priceMonthly}
              onChange={(e) => setNewPlan((p) => ({ ...p, priceMonthly: e.target.value }))}
              placeholder="Monthly price (€)"
              type="number"
              className="px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-bo-primary-600"
            />
            <input
              value={newPlan.features.maxMalls}
              onChange={(e) =>
                setNewPlan((p) => ({
                  ...p,
                  features: { ...p.features, maxMalls: Math.max(1, Number(e.target.value) || 1) },
                }))
              }
              placeholder="Max malls"
              type="number"
              min={1}
              className="px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-bo-primary-600"
            />
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {FEATURE_KEYS.map((f) => (
              <label
                key={f.key}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-bo-neutral-200 hover:border-bo-neutral-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={newPlan.features[f.key]}
                  onChange={(e) =>
                    setNewPlan((p) => ({
                      ...p,
                      features: { ...p.features, [f.key]: e.target.checked },
                    }))
                  }
                />
                <span className="text-sm font-medium text-bo-neutral-900">{f.label}</span>
              </label>
            ))}
          </div>
          <button
            onClick={createPlan}
            disabled={!newPlan.name.trim() || savingId === '__new__'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-bo-primary-600 text-white text-sm font-medium rounded-lg hover:bg-bo-primary-700 disabled:opacity-50"
          >
            {savingId === '__new__' ? 'Creating...' : 'Create plan'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="p-6 text-sm text-bo-neutral-400">Loading...</p>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-bo-neutral-200 p-6 text-sm text-bo-neutral-400">
          No plans yet. Create one to start assigning features to customers.
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const draft = drafts[plan.id] ?? readFeatures(plan.features);
            const saving = savingId === plan.id;
            const recentlySaved = savedAt[plan.id] && Date.now() - savedAt[plan.id] < 2500;
            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-bo-neutral-200 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-bo-neutral-900">{plan.name}</h2>
                    <div className="text-xs text-bo-neutral-400 mt-0.5">
                      {plan.priceMonthly != null
                        ? `€${plan.priceMonthly}/mo`
                        : 'Custom pricing'}
                    </div>
                  </div>
                  <button
                    onClick={() => savePlan(plan)}
                    disabled={!dirty[plan.id] || saving}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-bo-neutral-950 text-white hover:bg-bo-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {recentlySaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving...' : 'Save'}
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {FEATURE_KEYS.map((f) => (
                    <label
                      key={f.key}
                      className="flex items-start gap-3 p-3 rounded-lg border border-bo-neutral-200 hover:border-bo-neutral-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={draft[f.key]}
                        onChange={(e) => updateDraft(plan.id, { [f.key]: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-bo-neutral-900">{f.label}</div>
                        <div className="text-xs text-bo-neutral-500">{f.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <label className="text-xs uppercase tracking-wider text-bo-neutral-500 font-semibold">
                    Max malls
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={draft.maxMalls}
                    onChange={(e) =>
                      updateDraft(plan.id, { maxMalls: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="w-20 px-2 py-1 text-sm border border-bo-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-bo-primary-600"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
