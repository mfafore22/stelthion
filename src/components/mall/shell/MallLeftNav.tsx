/**
 * Mall Portfolio Left Navigation
 *
 * 72px icon-only vertical navigation rail for Finnish shopping malls UI
 * Features:
 * - Portfolio: Multi-property overview with KPIs
 * - Properties: Individual mall detail pages
 * - Campaigns: Marketing campaign management
 * - Analytics: Reports and insights
 *
 * Adapted from DOH Airport LeftNav for mall-specific use case
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Building2,
  Megaphone,
  BarChart3,
  TrendingUpDown,
  HandPlatter,
  LayoutPanelTop,
  Lock,
} from 'lucide-react';

function ShopperMindIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-block h-8 w-8',
        className && className.replace(/\bh-\d+\b|\bw-\d+\b/g, '').trim(),
      )}
    >
      <Image
        src="/ShopperMind_icon_vector.svg"
        alt=""
        fill
        sizes="32px"
        className="object-contain group-aria-[current=page]:invert"
      />
    </span>
  );
}
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import useSWR from 'swr';
import type { PlanFeatures } from '@/lib/plan-gate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface MallNavItem {
  id: string;
  label: string;
  labelOverride?: string;
  descriptionOverride?: string;
  icon: React.ElementType;
  route: string;
  disabled?: boolean;
}

const NAV_ITEMS: MallNavItem[] = [
  { id: 'portfolio',       label: 'Portfolio',       icon: LayoutGrid,     route: '/mall/portfolio' },
  { id: 'properties',      label: 'Properties',      icon: Building2,      route: '/mall/properties' },
  { id: 'campaigns',       label: 'Campaigns',       icon: Megaphone,      route: '/mall/campaigns' },
  { id: 'analytics',       label: 'Analytics',       icon: BarChart3,      route: '/mall/analytics' },
  { id: 'scenarios',       label: 'Scenarios',       icon: TrendingUpDown, route: '/mall/scenarios' },
  { id: 'assistants',      label: 'Assistants',      icon: HandPlatter,    route: '/mall/assistants' },
  { id: 'shoppermind',     label: 'ShopperMind',     icon: ShopperMindIcon, route: '/mall/shoppermind' },
  { id: 'space-optimizer', label: 'Space Optimizer', icon: LayoutPanelTop, route: '/mall/space-optimizer' },
];

export interface MallLeftNavProps {
  /**
   * Management company ID for filtering properties
   * Management company ID for filtering properties.
   */
  managementCompanyId?: string;
  /**
   * Optional callback when navigation changes
   */
  onNavigate?: (itemId: string) => void;
  /**
   * Optional className for custom styling
   */
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MallLeftNav({
  managementCompanyId,
  onNavigate,
  className,
}: MallLeftNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();
  const { t } = useTranslation();
  const { data: features } = useSWR<PlanFeatures>('/api/mall/my-features', fetcher);

  // Base active items — always enabled
  const ALWAYS_ACTIVE = new Set(['portfolio', 'properties']);
  // Plan-gated items
  const planActive = new Set<string>([
    ...(features?.shoppermind ? ['shoppermind'] : []),
    ...(features?.concierge ? ['assistants'] : []),
    ...(features?.spaceAllocation ? ['space-optimizer'] : []),
  ]);

  // Generate tenant-specific navigation items
  const navItems = React.useMemo(() => {
    if (!user) return NAV_ITEMS.map(item => ({
      ...item,
      disabled: !ALWAYS_ACTIVE.has(item.id),
    }));

    const tenantSlug = user.companyName.toLowerCase().replace(/\s+/g, '-');

    return NAV_ITEMS
      .map(item => {
        const disabled = !ALWAYS_ACTIVE.has(item.id) && !planActive.has(item.id);

        if (item.id === 'portfolio') {
          if (user.isMultiProperty) {
            return {
              ...item,
              route: `/tenant/${tenantSlug}/portfolio`,
              disabled,
            };
          }
          return { ...item, route: '/mall/portfolio', disabled };
        }

        if (item.id === 'properties') {
          if (!user.isMultiProperty) {
            return {
              ...item,
              route: '/mall/properties',
              disabled,
            };
          }
        }

        return { ...item, disabled };
      });
  }, [user]);

  // Determine active item from pathname
  const activeItemId = navItems.find(item =>
    pathname?.startsWith(item.route)
  )?.id || 'portfolio';

  const handleNavClick = (item: MallNavItem) => {
    if (item.disabled) return;
    if (onNavigate) {
      onNavigate(item.id);
    }
    router.push(item.route);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        className={cn(
          'fixed left-0 top-0 h-screen w-[80px]',
          'bg-bo-neutral-50 flex flex-col items-center z-40',
          'border-r border-bo-neutral-200 shadow-bo-sm',
          className
        )}
        aria-label="Mall portfolio navigation"
      >
        {/* Swirl logo — vertically centered in the 80px top bar row */}
        <div className="h-[80px] w-full flex items-center justify-center shrink-0">
          <Image
            src="/stelthion-swirl-v2.png"
            alt="Stelthion"
            width={26}
            height={26}
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItemId === item.id;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'group w-14 h-14 rounded-xl flex items-center justify-center',
                    'transition-all duration-300 ease-bo-out-expo',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bo-primary-600 focus-visible:ring-opacity-20',
                    item.disabled && 'text-bo-neutral-400 cursor-not-allowed opacity-60',
                    !item.disabled && isActive && 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md -translate-y-0.5',
                    !item.disabled && !isActive && 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  aria-disabled={item.disabled || undefined}
                >
                  {item.disabled && !ALWAYS_ACTIVE.has(item.id) ? (
                    <span className="relative">
                      <Icon className="h-6 w-6" />
                      <Lock className="h-3 w-3 absolute -bottom-1 -right-1 text-bo-neutral-400" />
                    </span>
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="nav-tooltip rounded-lg px-3 py-2"
              >
                <div className="text-sm font-semibold text-white tracking-tight">
                  {item.labelOverride ?? t(`mall:navigation.${item.id}.label`)}
                </div>
                <div className="text-xs text-gray-300 mt-1 leading-relaxed">
                  {item.disabled && !ALWAYS_ACTIVE.has(item.id)
                    ? t('navigation.upgradePlan', 'Upgrade your plan to unlock')
                    : item.disabled
                      ? t('navigation.comingSoon', 'Coming Soon')
                      : (item.descriptionOverride ?? t(`mall:navigation.${item.id}.description`))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Management Company Indicator (if provided) */}
        {managementCompanyId && (
          <div className="mt-auto pt-6 w-full border-t border-bo-neutral-200 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-12 h-12 rounded-full bg-bo-beige-200 border border-bo-beige-300 flex items-center justify-center text-xs text-bo-beige-800 font-semibold uppercase shadow-bo-sm">
                  {managementCompanyId.slice(0, 2)}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="nav-tooltip rounded-lg px-3 py-2"
              >
                <div className="text-xs text-gray-300 uppercase tracking-wider">
                  {t('mall:navigation.managementCompany')}
                </div>
                <div className="text-sm font-semibold text-white capitalize mt-1">
                  {managementCompanyId}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        </div>
      </nav>
    </TooltipProvider>
  );
}
