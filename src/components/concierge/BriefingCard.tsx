/**
 * Briefing Card
 *
 * Renders a structured daily briefing with collapsible sections.
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sun, Users, Calendar, Train } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface BriefingSection {
  key: string;
  title: string;
  content: string;
  data?: unknown;
}

interface BriefingCardProps {
  sections: BriefingSection[];
  date: string;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  weather: Sun,
  footfall: Users,
  events: Calendar,
  transport: Train,
};

export function BriefingCard({ sections, date }: BriefingCardProps) {
  const { t } = useTranslation('mall');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.key)));

  const toggle = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bo-surface-subtle overflow-hidden rounded-xl border border-bo-primary-200/50 shadow-bo-glass">
      <div className="h-1.5 bg-gradient-to-r from-bo-primary-700 via-bo-success-dark to-bo-warning-dark" />
      <div className="px-4 py-3 border-b border-bo-neutral-200/50">
        <div className="text-xs font-semibold text-bo-primary-700 uppercase tracking-wider">
          {t('concierge.briefing.title', 'Daily Briefing')}
        </div>
        <div className="text-[10px] text-bo-neutral-500 mt-0.5">
          {new Date(date).toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="divide-y divide-bo-neutral-200/30">
        {sections.map((section) => {
          const Icon = SECTION_ICONS[section.key] || Sun;
          const isExpanded = expandedSections.has(section.key);

          return (
            <div key={section.key}>
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-white/55"
              >
                <Icon className="h-3.5 w-3.5 text-bo-neutral-500" />
                <span className="text-xs font-medium text-bo-neutral-800 flex-1 text-left">
                  {t(`concierge.briefing.sections.${section.key}`, section.title)}
                </span>
                {isExpanded
                  ? <ChevronUp className="h-3 w-3 text-bo-neutral-400" />
                  : <ChevronDown className="h-3 w-3 text-bo-neutral-400" />
                }
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 text-xs text-bo-neutral-600 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
