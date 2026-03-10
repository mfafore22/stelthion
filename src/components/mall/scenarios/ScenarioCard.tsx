/**
 * ScenarioCard Component
 *
 * Interactive card for scenario simulations
 * Displays scenario details and allows users to run calculations
 * Uses real tenant data for all predictions
 */

'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateWeatherShock } from '@/lib/scenarios/weatherShock';
import { ScenarioResultsModal, ScenarioResult } from './ScenarioResultsModal';

interface ScenarioCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  dataSource: string;
  mallId: string;
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    button: 'hover:border-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-600',
  },
  green: {
    icon: 'text-green-600',
    border: 'border-green-200',
    bg: 'bg-green-50',
    button: 'hover:border-green-500',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-600',
  },
  orange: {
    icon: 'text-orange-600',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    button: 'hover:border-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-600',
  },
  purple: {
    icon: 'text-purple-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    button: 'hover:border-purple-500',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-600',
  },
  red: {
    icon: 'text-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    button: 'hover:border-red-500',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-600',
  },
};

export function ScenarioCard({
  id,
  title,
  description,
  icon: Icon,
  color,
  dataSource,
  mallId,
}: ScenarioCardProps) {
  const { t, i18n } = useTranslation();
  const [isCalculating, setIsCalculating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const colors = colorClasses[color];
  const isFinnish = i18n.language === 'fi';

  const handleCalculate = () => {
    setIsCalculating(true);

    // Simulate API call delay for realistic UX
    setTimeout(() => {
      // Only weather-shock scenario is implemented for now
      if (id === 'weather-shock') {
        // Calculate with heavy rain as default weather condition
        const scenarioResult = calculateWeatherShock('heavy_rain', mallId, isFinnish);
        setResult(scenarioResult);
        setShowModal(true);
      } else {
        // Other scenarios coming soon
        alert(isFinnish ? 'Tulossa pian!' : 'Coming soon!');
      }
      setIsCalculating(false);
    }, 1500);
  };

  return (
    <>
      <Card className={cn(
        'p-6 bg-bo-glass border-2 shadow-bo-glass-strong backdrop-blur-xl transition-all duration-300',
        colors.border,
        'hover:shadow-bo-glass-stronger hover:-translate-y-1'
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
              {title}
            </h3>
            <p className="text-sm text-bo-neutral-600">
              {description}
            </p>
          </div>
        </div>

        {/* Data Source Badge */}
        <div className="mb-4">
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
            colors.badge
          )}>
            <div className={cn('h-2 w-2 rounded-full animate-pulse', colors.dot)} />
            <span>
              {dataSource}
            </span>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          variant="outline"
          className={cn(
            'w-full border-2 border-bo-neutral-300 transition-all duration-200',
            colors.button,
            isCalculating && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isCalculating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-bo-neutral-400 border-t-transparent rounded-full mr-2" />
              Calculating...
            </>
          ) : (
            t('mall:scenarios.calculate')
          )}
        </Button>

        {/* Coming Soon Notice (only for non-weather scenarios) */}
        {id !== 'weather-shock' && (
          <p className="text-xs text-bo-neutral-500 text-center mt-3">
            {isFinnish ? 'Tulossa pian' : 'Coming soon'}
          </p>
        )}
      </Card>

      {/* Results Modal */}
      <ScenarioResultsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        result={result}
      />
    </>
  );
}
