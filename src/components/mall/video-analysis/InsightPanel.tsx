'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { Sparkles, RefreshCw, AlertTriangle, AlertCircle, Cpu, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisInsight } from './types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface InsightPanelProps {
  jobId: string;
}

export function InsightPanel({ jobId }: InsightPanelProps) {
  const { t } = useTranslation('mall');
  const [generating, setGenerating] = useState(false);

  const { data, mutate } = useSWR<{ insights: AnalysisInsight[] }>(
    `/api/analysis/insights/${jobId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const insights = data?.insights ?? [];
  const latestInsight = insights[0]; // Most recent first

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      await fetch(`/api/analysis/insights/${jobId}`, { method: 'POST' });
      await mutate();
    } finally {
      setGenerating(false);
    }
  }, [jobId, mutate]);

  // Alert-level styling
  const alertStyles: Record<string, { border: string; bg: string; icon: React.ReactNode }> = {
    critical: {
      border: 'border-red-300',
      bg: 'bg-red-50',
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
    },
    warning: {
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    },
    info: {
      border: 'border-bo-primary-200',
      bg: 'bg-bo-primary-50/50',
      icon: <Sparkles className="w-4 h-4 text-bo-primary-500" />,
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-bo-neutral-700 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-bo-primary-500" />
          {t('videoAnalysis.insights.title', 'AI Insights')}
        </h4>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs font-medium text-bo-primary-600 hover:text-bo-primary-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating
            ? t('videoAnalysis.insights.generating', 'Generating...')
            : t('videoAnalysis.insights.generate', 'Generate Insights')
          }
        </button>
      </div>

      <AnimatePresence mode="wait">
        {latestInsight ? (
          <motion.div
            key={latestInsight.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-lg border p-4 space-y-3 ${alertStyles[latestInsight.alertLevel]?.bg ?? alertStyles.info.bg} ${alertStyles[latestInsight.alertLevel]?.border ?? alertStyles.info.border}`}
          >
            {/* Source badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {alertStyles[latestInsight.alertLevel]?.icon ?? alertStyles.info.icon}
                <SourceBadge source={latestInsight.source} />
              </div>
              <span className="text-[10px] text-bo-neutral-400">
                {new Date(latestInsight.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Summary */}
            <p className="text-sm text-bo-neutral-800 leading-relaxed">
              {latestInsight.summary}
            </p>

            {/* Recommendations */}
            {latestInsight.recommendations && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-bo-neutral-600 uppercase tracking-wider">
                  {t('videoAnalysis.insights.recommendations', 'Recommendations')}
                </p>
                <ul className="space-y-1">
                  {parseRecommendations(latestInsight.recommendations).map((rec, i) => (
                    <li key={i} className="text-xs text-bo-neutral-700 flex items-start gap-1.5">
                      <span className="text-bo-primary-500 mt-0.5 shrink-0">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-dashed border-bo-neutral-300 p-6 text-center"
          >
            <Sparkles className="w-6 h-6 text-bo-neutral-300 mx-auto mb-2" />
            <p className="text-xs text-bo-neutral-400">
              {t('videoAnalysis.insights.noInsights', 'No insights yet. Click "Generate Insights" to analyze this job\'s results.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show older insights if more than one */}
      {insights.length > 1 && (
        <details className="text-xs">
          <summary className="text-bo-neutral-400 cursor-pointer hover:text-bo-neutral-600">
            {t('videoAnalysis.insights.previousCount', '{{count}} previous insights', { count: insights.length - 1 })}
          </summary>
          <div className="mt-2 space-y-2">
            {insights.slice(1).map((ins) => (
              <div key={ins.id} className="rounded border border-bo-neutral-200 p-3 bg-bo-neutral-50/50">
                <div className="flex items-center justify-between mb-1">
                  <SourceBadge source={ins.source} />
                  <span className="text-[10px] text-bo-neutral-400">
                    {new Date(ins.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-bo-neutral-700">{ins.summary}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: 'edge' | 'server' }) {
  if (source === 'edge') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
        <Cpu className="w-3 h-3" /> Edge AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
      <Server className="w-3 h-3" /> Server AI
    </span>
  );
}

function parseRecommendations(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Not JSON — split by newlines
  }
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}
