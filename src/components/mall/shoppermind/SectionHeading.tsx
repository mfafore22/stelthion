import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Users, ShoppingBag, Building2, Building } from 'lucide-react';

export type SectionKind = 'macro' | 'consumer' | 'retail' | 'property' | 'mallImpact';

const ICONS: Record<SectionKind, LucideIcon> = {
  macro: TrendingUp,
  consumer: Users,
  retail: ShoppingBag,
  property: Building2,
  mallImpact: Building,
};

const ACCENTS: Record<SectionKind, string> = {
  macro: 'bg-bo-accent',
  consumer: 'bg-bo-primary-500',
  retail: 'bg-bo-warning',
  property: 'bg-bo-neutral-700',
  mallImpact: 'bg-bo-primary-700',
};

export function SectionHeading({ kind, label }: { kind: SectionKind; label: string }) {
  const Icon = ICONS[kind];
  const accent = ACCENTS[kind];
  return (
    <div className="flex items-center gap-2 mb-1.5 mt-3 first:mt-0">
      <span className={`w-0.5 h-3.5 rounded-full ${accent}`} />
      <Icon size={12} className="text-bo-neutral-500 shrink-0" />
      <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-700">
        {label}
      </span>
    </div>
  );
}
