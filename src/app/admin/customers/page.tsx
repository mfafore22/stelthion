'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, Users, Store } from 'lucide-react';
import { parsePlanFeatures } from '@/lib/plan-gate';

interface Plan {
  id: string;
  name: string;
  features: unknown;
}

interface CustomerRow {
  id: string;
  name: string;
  createdAt: string;
  plan: Plan | null;
  _count: { malls: number; users: number };
}

const PLAN_COLORS: Record<string, string> = {
  Starter: 'bg-bo-neutral-100 text-bo-neutral-600',
  Pro: 'bg-blue-100 text-blue-700',
  Enterprise: 'bg-purple-100 text-purple-700',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/customers').then((r) => r.json()),
      fetch('/api/admin/plans').then((r) => r.json()),
    ])
      .then(([customerData, planData]) => {
        if (Array.isArray(customerData)) setCustomers(customerData);
        if (Array.isArray(planData)) setPlans(planData);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handlePlanChange(customerId: string, planId: string) {
    setUpdatingId(customerId);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: planId || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, plan: updated.plan } : c)),
      );
    } catch (err) {
      console.error('Failed to update plan', err);
      alert('Failed to update plan. Check console.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-bo-primary-600" />
          <h1 className="text-xl font-bold text-bo-neutral-900">Customer Accounts</h1>
        </div>
        <Link
          href="/admin/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-bo-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-bo-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-bo-neutral-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-bo-neutral-400">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-sm text-bo-neutral-400">
            No customers yet. <Link href="/admin/customers/new" className="text-bo-primary-600 underline">Add the first one.</Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bo-neutral-50 border-b border-bo-neutral-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-bo-neutral-600">Company</th>
                <th className="text-left px-5 py-3 font-medium text-bo-neutral-600">Plan</th>
                <th className="text-left px-5 py-3 font-medium text-bo-neutral-600">Features</th>
                <th className="text-center px-5 py-3 font-medium text-bo-neutral-600">Malls</th>
                <th className="text-center px-5 py-3 font-medium text-bo-neutral-600">Users</th>
                <th className="text-right px-5 py-3 font-medium text-bo-neutral-600">Created</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const features = parsePlanFeatures(c.plan?.features);
                const planColor = c.plan ? (PLAN_COLORS[c.plan.name] ?? 'bg-bo-neutral-100 text-bo-neutral-600') : '';
                return (
                  <tr key={c.id} className="border-t border-bo-neutral-100 hover:bg-bo-neutral-50">
                    <td className="px-5 py-3 font-medium text-bo-neutral-900">{c.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {c.plan && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planColor}`}>
                            {c.plan.name}
                          </span>
                        )}
                        <select
                          value={c.plan?.id ?? ''}
                          disabled={updatingId === c.id}
                          onChange={(e) => handlePlanChange(c.id, e.target.value)}
                          className="text-xs border border-bo-neutral-200 rounded px-2 py-1 bg-white hover:border-bo-neutral-300 focus:outline-none focus:ring-1 focus:ring-bo-primary-600 disabled:opacity-50"
                          aria-label={`Change plan for ${c.name}`}
                        >
                          <option value="">No plan</option>
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {features.shoppermind && <FeatureBadge label="ShopperMind" color="blue" />}
                        {features.edgeVision && <FeatureBadge label="Edge Vision" color="green" />}
                        {features.concierge && <FeatureBadge label="Concierge" color="purple" />}
                        {Boolean(
                          (c.plan?.features as { spaceAllocation?: boolean } | null | undefined)
                            ?.spaceAllocation,
                        ) && <FeatureBadge label="Space Optimizer" color="amber" />}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-bo-neutral-600">
                        <Store className="w-3.5 h-3.5" />
                        {c._count.malls}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-bo-neutral-600">
                        <Users className="w-3.5 h-3.5" />
                        {c._count.users}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-bo-neutral-400 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FeatureBadge({
  label,
  color,
}: {
  label: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${colors[color]}`}>
      {label}
    </span>
  );
}
