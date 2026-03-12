/**
 * Scenario Shortcuts Component
 * Quick access to common scenario planning templates
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface ScenarioShortcutsProps {
  mallId: string;
}

export function ScenarioShortcuts({ mallId }: ScenarioShortcutsProps) {
  const { t } = useTranslation('mall');

  const scenarios = [
    {
      id: 'weather',
      name: t('shortcuts.weather.name'),
      description: t('shortcuts.weather.description'),
      icon: Cloud,
      color: 'text-bo-info-dark',
    },
    {
      id: 'campaign',
      name: t('shortcuts.campaign.name'),
      description: t('shortcuts.campaign.description'),
      icon: TrendingUp,
      color: 'text-bo-success-dark',
    },
    {
      id: 'tenant',
      name: t('shortcuts.tenant.name'),
      description: t('shortcuts.tenant.description'),
      icon: Users,
      color: 'text-bo-accent-700',
    },
  ];

  return (
    <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
      <h3 className="mb-4 text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('shortcuts.title')}</h3>
      <div className="space-y-3">
        {scenarios.map((scenario) => (
          <Link key={scenario.id} href="/mall/scenarios">
            <Button
              variant="outline"
              className="h-auto w-full justify-start gap-3 p-4 border-bo-neutral-300 hover:border-bo-primary-600 hover:bg-bo-glass-subtle transition-all duration-200"
            >
              <scenario.icon className={`h-5 w-5 ${scenario.color}`} />
              <div className="text-left">
                <div className="font-semibold text-bo-neutral-950">{scenario.name}</div>
                <div className="text-sm text-bo-neutral-600">{scenario.description}</div>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  );
}
