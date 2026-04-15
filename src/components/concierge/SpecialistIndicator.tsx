/**
 * Specialist Indicator
 *
 * Subtle inline pill showing which specialist is active.
 * Replaces the verbose AgentSuggestionBanner.
 */

'use client';

import React from 'react';
import { Sun, Users, Calendar, Car, TrendingUp, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface SpecialistIndicatorProps {
  agentRole?: string | null;
  visible?: boolean;
}

const SPECIALIST_MAP: Record<string, {
  icon: React.ElementType;
  labelKey: string;
  fallback: { en: string; fi: string };
}> = {
  'footfall-analyst': {
    icon: Users,
    labelKey: 'concierge.specialist.footfall',
    fallback: { en: 'Footfall analyst', fi: 'Kävijämääräanalyytikko' },
  },
  'event-coordinator': {
    icon: Calendar,
    labelKey: 'concierge.specialist.events',
    fallback: { en: 'Event coordinator', fi: 'Tapahtumakoordinaattori' },
  },
  'sales-optimizer': {
    icon: TrendingUp,
    labelKey: 'concierge.specialist.trends',
    fallback: { en: 'Trend analyst', fi: 'Trendianalyytikko' },
  },
  'parking-manager': {
    icon: Car,
    labelKey: 'concierge.specialist.parking',
    fallback: { en: 'Parking manager', fi: 'Pysäköintipäällikkö' },
  },
  'trend-analyst': {
    icon: TrendingUp,
    labelKey: 'concierge.specialist.trends',
    fallback: { en: 'Trend analyst', fi: 'Trendianalyytikko' },
  },
  'general-assistant': {
    icon: Bot,
    labelKey: 'concierge.specialist.general',
    fallback: { en: 'Assistant', fi: 'Avustaja' },
  },
};

// Weather specialist — triggered by weather-related agent routing
const WEATHER_SPECIALIST = {
  icon: Sun,
  labelKey: 'concierge.specialist.weather',
  fallback: { en: 'Weather specialist', fi: 'Säätilaasiantuntija' },
};

export function SpecialistIndicator({ agentRole, visible = true }: SpecialistIndicatorProps) {
  const { t, i18n } = useTranslation('mall');
  const lang = i18n.language as 'en' | 'fi';

  if (!agentRole || !visible) return null;

  const spec = SPECIALIST_MAP[agentRole] || SPECIALIST_MAP['general-assistant'];
  const Icon = spec.icon;
  const label = t(spec.labelKey, spec.fallback[lang] || spec.fallback.en);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bo-neutral-100/60 text-bo-neutral-500"
      >
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-medium">{label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
