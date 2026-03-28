/**
 * ScenarioResultsModal Component
 *
 * Displays scenario calculation results with:
 * - Before/After comparison chart
 * - Key metrics (Footfall, Revenue, Conversion, Dwell Time)
 * - Confidence indicator
 * - Data sources and assumptions
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ScenarioResult {
  predicted: {
    footfall: number;
    footfallLift: number; // Percentage change
    revenue: number;
    revenueLift: number;
    conversion: number;
    dwellTime: number;
  };
  baseline: {
    footfall: number;
    revenue: number;
    conversion: number;
    dwellTime: number;
  };
  confidence: {
    level: 'high' | 'medium' | 'low';
    factors: string[];
  };
  dataSource: {
    name: string; // "STELTHION SIGNALS"
    apis: string[];
    baselines: string[];
  };
  assumptions: string[];
  scenarioName: string;
  scenarioDescription: string;
}

interface ScenarioResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScenarioResult | null;
}

export function ScenarioResultsModal({ isOpen, onClose, result }: ScenarioResultsModalProps) {
  const { t, i18n } = useTranslation();
  const isFinnish = i18n.language === 'fi';

  if (!isOpen || !result) return null;

  const confidenceColors = {
    high: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
    medium: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-600' },
    low: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-600' },
  };

  const confidenceColor = confidenceColors[result.confidence.level];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-bo-neutral-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-bo-neutral-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
              {result.scenarioName}
            </h2>
            <p className="text-sm text-bo-neutral-600 mt-1">{result.scenarioDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bo-neutral-200 transition-colors"
          >
            <X className="h-5 w-5 text-bo-neutral-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Before/After Comparison */}
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 mb-4">
              {t('mall:scenarios.results.comparison')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Baseline */}
              <Card className="p-4 bg-bo-neutral-50 border-bo-neutral-200">
                <div className="text-sm text-bo-neutral-600 mb-2">
                  {t('mall:scenarios.results.baseline')}
                </div>
                <div className="text-3xl font-bold text-bo-neutral-800">
                  {result.baseline.footfall.toLocaleString()}
                </div>
                <div className="text-xs text-bo-neutral-600 mt-1">
                  {t('mall:scenarios.results.visitorsPerHour')}
                </div>
              </Card>

              {/* Predicted */}
              <Card className={cn(
                "p-4 border-2",
                result.predicted.footfallLift >= 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}>
                <div className="text-sm text-bo-neutral-600 mb-2">
                  {t('mall:scenarios.results.predicted')}
                </div>
                <div className={cn(
                  "text-3xl font-bold",
                  result.predicted.footfallLift >= 0 ? "text-green-700" : "text-red-700"
                )}>
                  {result.predicted.footfall.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {result.predicted.footfallLift >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={cn(
                    "text-sm font-semibold",
                    result.predicted.footfallLift >= 0 ? "text-green-700" : "text-red-700"
                  )}>
                    {result.predicted.footfallLift > 0 ? '+' : ''}{result.predicted.footfallLift.toFixed(1)}%
                  </span>
                </div>
              </Card>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 mb-4">
              {t('mall:scenarios.results.keyMetrics')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Revenue */}
              <Card className="p-4 bg-bo-glass border-bo-neutral-200/30">
                <div className="text-xs text-bo-neutral-600 mb-1">
                  {t('mall:scenarios.results.revenue')}
                </div>
                <div className="text-xl font-bold text-bo-neutral-950">
                  €{(result.predicted.revenue / 1000).toFixed(0)}k
                </div>
                <div className={cn(
                  "text-xs font-medium",
                  result.predicted.revenueLift >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {result.predicted.revenueLift > 0 ? '+' : ''}{result.predicted.revenueLift.toFixed(1)}%
                </div>
              </Card>

              {/* Conversion */}
              <Card className="p-4 bg-bo-glass border-bo-neutral-200/30">
                <div className="text-xs text-bo-neutral-600 mb-1">
                  {t('mall:scenarios.results.conversion')}
                </div>
                <div className="text-xl font-bold text-bo-neutral-950">
                  {(result.predicted.conversion * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-bo-neutral-600">
                  {t('mall:scenarios.results.ofVisitors')}
                </div>
              </Card>

              {/* Dwell Time */}
              <Card className="p-4 bg-bo-glass border-bo-neutral-200/30">
                <div className="text-xs text-bo-neutral-600 mb-1">
                  {t('mall:scenarios.results.dwellTime')}
                </div>
                <div className="text-xl font-bold text-bo-neutral-950">
                  {result.predicted.dwellTime.toFixed(0)}m
                </div>
                <div className="text-xs text-bo-neutral-600">
                  {t('mall:scenarios.results.average')}
                </div>
              </Card>

              {/* Footfall */}
              <Card className="p-4 bg-bo-glass border-bo-neutral-200/30">
                <div className="text-xs text-bo-neutral-600 mb-1">
                  {t('mall:scenarios.results.footfall')}
                </div>
                <div className="text-xl font-bold text-bo-neutral-950">
                  {result.predicted.footfall.toLocaleString()}
                </div>
                <div className="text-xs text-bo-neutral-600">
                  {t('mall:scenarios.results.perHour')}
                </div>
              </Card>
            </div>
          </div>

          {/* Confidence Indicator */}
          <Card className={cn(
            "p-4 border-2",
            confidenceColor.bg,
            confidenceColor.border
          )}>
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", confidenceColor.bg)}>
                <CheckCircle className={cn("h-5 w-5", confidenceColor.text)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-2 w-2 rounded-full", confidenceColor.dot)} />
                  <span className={cn("font-semibold text-sm uppercase tracking-wide", confidenceColor.text)}>
                    {t(`mall:scenarios.results.confidence.${result.confidence.level}`)}
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-bo-neutral-700">
                  {result.confidence.factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-bo-neutral-400">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Data Source */}
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 mb-3">
              {t('mall:scenarios.results.dataSource')}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span>{result.dataSource.name}</span>
              </div>
            </div>
            <div className="text-sm text-bo-neutral-600 space-y-1">
              {result.dataSource.baselines.map((baseline, index) => (
                <div key={index}>• {baseline}</div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 mb-3">
              {t('mall:scenarios.results.assumptions')}
            </h3>
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <ul className="space-y-2 text-sm text-bo-neutral-700">
                  {result.assumptions.map((assumption, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-bo-neutral-400">•</span>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-bo-beige-100 border-t border-bo-neutral-200 p-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-2 border-bo-neutral-300 hover:bg-bo-neutral-100"
          >
            {t('mall:scenarios.results.close')}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t('mall:scenarios.results.runAnotherScenario')}
          </Button>
        </div>
      </div>
    </div>
  );
}
