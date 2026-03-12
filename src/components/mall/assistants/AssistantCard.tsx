/**
 * AssistantCard Component
 *
 * Display card for AI assistant agents
 * Shows agent details and indicates LLM integration status
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssistantCardProps {
  id: string;
  name: string;
  nameFi: string;
  description: string;
  descriptionFi: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  mallId: string;
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-600',
  },
  green: {
    icon: 'text-green-600',
    border: 'border-green-200',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-600',
  },
  orange: {
    icon: 'text-orange-600',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-600',
  },
  purple: {
    icon: 'text-purple-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-600',
  },
  red: {
    icon: 'text-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-600',
  },
};

export function AssistantCard({
  id,
  name,
  nameFi,
  description,
  descriptionFi,
  icon: Icon,
  color,
  mallId,
}: AssistantCardProps) {
  const { i18n } = useTranslation();
  const colors = colorClasses[color];
  const isFinnish = i18n.language === 'fi';

  return (
    <Card className={cn(
      'p-6 bg-bo-glass border-2 shadow-bo-glass-strong backdrop-blur-xl transition-all duration-300',
      colors.border,
      'hover:shadow-bo-glass-stronger hover:-translate-y-1',
      'opacity-75' // Reduced opacity to indicate not yet active
    )}>
      {/* Icon and Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className={cn(
          'p-3 rounded-xl',
          colors.bg
        )}>
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight mb-1">
            {isFinnish ? nameFi : name}
          </h3>
          <p className="text-sm text-bo-neutral-600">
            {isFinnish ? descriptionFi : description}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-start">
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
          colors.badge
        )}>
          <div className={cn('h-2 w-2 rounded-full opacity-50', colors.dot)} />
          {isFinnish ? 'Tulossa pian' : 'Coming soon'}
        </div>
      </div>

      {/* Tools Preview (for future) */}
      <div className="mt-4 pt-4 border-t border-bo-neutral-200">
        <p className="text-xs text-bo-neutral-500">
          {isFinnish
            ? 'Käyttää skenaarioita työkaluina tehtävien suorittamiseen'
            : 'Uses scenarios as tools to perform tasks'}
        </p>
      </div>
    </Card>
  );
}
