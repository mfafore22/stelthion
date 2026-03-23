import { Eye, ArrowRightLeft, Route } from 'lucide-react';
import type { AnalysisMode } from './types';

export const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
}).filter((t) => t <= '21:00');

export const JOURNEY_OPTIONS = [1, 5, 10, 15, 20];

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-bo-warning-light text-bo-warning-dark',
  PROCESSING: 'bg-bo-info-light text-bo-info-dark',
  COMPLETE: 'bg-bo-success-light text-bo-success-dark',
  FAILED: 'bg-bo-error-light text-bo-error-dark',
};

export const MODE_META: Record<AnalysisMode, { icon: typeof Eye; labelKey: string; descKey: string; color: string }> = {
  ZONE_COUNT: {
    icon: Eye,
    labelKey: 'videoAnalysis.modes.zoneCount',
    descKey: 'videoAnalysis.modesDescription.zoneCount',
    color: 'bg-bo-primary-50 text-bo-primary-700',
  },
  AB_TRACKING: {
    icon: ArrowRightLeft,
    labelKey: 'videoAnalysis.modes.abTracking',
    descKey: 'videoAnalysis.modesDescription.abTracking',
    color: 'bg-bo-accent-50 text-bo-accent-700',
  },
  JOURNEY_MAP: {
    icon: Route,
    labelKey: 'videoAnalysis.modes.journeyMap',
    descKey: 'videoAnalysis.modesDescription.journeyMap',
    color: 'bg-bo-beige-200 text-bo-beige-800',
  },
};