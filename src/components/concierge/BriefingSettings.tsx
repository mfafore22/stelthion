/**
 * Briefing Settings
 *
 * Manage daily briefing subscription: toggle on/off, set delivery time,
 * choose which sections to include.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Bell, BellOff, Sun, Users, Calendar, Train, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface BriefingSubscription {
  enabled: boolean;
  timeUtc: string;
  sections: string[];
}

const AVAILABLE_SECTIONS = [
  { key: 'weather', icon: Sun },
  { key: 'footfall', icon: Users },
  { key: 'events', icon: Calendar },
  { key: 'transport', icon: Train },
] as const;

const TIME_OPTIONS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00',
];

interface BriefingSettingsProps {
  mallId: string;
  onClose?: () => void;
}

export function BriefingSettings({ mallId, onClose }: BriefingSettingsProps) {
  const { t } = useTranslation('mall');
  const [subscription, setSubscription] = useState<BriefingSubscription>({
    enabled: false,
    timeUtc: '06:00',
    sections: ['weather', 'footfall', 'events', 'transport'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current subscription
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/concierge/briefing/subscription?mallId=${mallId}`);
        if (res.ok) {
          const data = await res.json();
          setSubscription({
            enabled: data.enabled ?? false,
            timeUtc: data.timeUtc ?? '06:00',
            sections: data.sections ?? ['weather', 'footfall', 'events', 'transport'],
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mallId]);

  // Save subscription
  const save = useCallback(async (updates: Partial<BriefingSubscription>) => {
    const updated = { ...subscription, ...updates };
    setSubscription(updated);
    setSaving(true);
    setSaved(false);

    try {
      await fetch('/api/concierge/briefing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId, ...updated }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Revert on error
      setSubscription(subscription);
    } finally {
      setSaving(false);
    }
  }, [mallId, subscription]);

  const toggleSection = (key: string) => {
    const sections = subscription.sections.includes(key)
      ? subscription.sections.filter(s => s !== key)
      : [...subscription.sections, key];
    // Require at least one section
    if (sections.length === 0) return;
    save({ sections });
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-bo-neutral-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-white/90 backdrop-blur-lg border border-bo-neutral-200/60 rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-bo-neutral-200/30 flex items-center justify-between">
        <div className="text-xs font-semibold text-bo-neutral-800">
          {t('concierge.briefing.subscribe', 'Daily Briefing')}
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-[10px] text-green-600"
            >
              <Check className="h-3 w-3" />
              {t('common.saved', 'Saved')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 space-y-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {subscription.enabled ? (
              <Bell className="h-3.5 w-3.5 text-bo-primary-600" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-bo-neutral-400" />
            )}
            <span className="text-xs text-bo-neutral-700">
              {t('concierge.briefing.subscribe', 'Subscribe to daily briefing')}
            </span>
          </div>
          <button
            onClick={() => save({ enabled: !subscription.enabled })}
            disabled={saving}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              subscription.enabled ? 'bg-bo-primary-500' : 'bg-bo-neutral-300'
            }`}
          >
            <motion.div
              animate={{ x: subscription.enabled ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        {/* Time picker */}
        <AnimatePresence>
          {subscription.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-4"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="h-3 w-3 text-bo-neutral-500" />
                  <span className="text-[10px] font-medium text-bo-neutral-600 uppercase tracking-wider">
                    {t('concierge.briefing.deliveryTime', 'Delivery time')} (UTC)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_OPTIONS.map(time => (
                    <button
                      key={time}
                      onClick={() => save({ timeUtc: time })}
                      disabled={saving}
                      className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                        subscription.timeUtc === time
                          ? 'bg-bo-primary-500 text-white border-bo-primary-500'
                          : 'bg-bo-neutral-50 text-bo-neutral-600 border-bo-neutral-200 hover:border-bo-primary-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section toggles */}
              <div>
                <div className="text-[10px] font-medium text-bo-neutral-600 uppercase tracking-wider mb-2">
                  {t('concierge.briefing.sections.weather', 'Sections')}
                </div>
                <div className="space-y-1.5">
                  {AVAILABLE_SECTIONS.map(({ key, icon: Icon }) => {
                    const active = subscription.sections.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleSection(key)}
                        disabled={saving}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          active
                            ? 'bg-bo-primary-50 border-bo-primary-200 text-bo-neutral-800'
                            : 'bg-bo-neutral-50 border-bo-neutral-200/60 text-bo-neutral-400'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${active ? 'text-bo-primary-600' : 'text-bo-neutral-300'}`} />
                        <span className="text-xs flex-1 text-left">
                          {t(`concierge.briefing.sections.${key}`, key)}
                        </span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          active ? 'bg-bo-primary-500 border-bo-primary-500' : 'border-bo-neutral-300'
                        }`}>
                          {active && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {onClose && (
        <div className="px-4 py-2.5 border-t border-bo-neutral-200/30">
          <button
            onClick={onClose}
            className="text-[10px] text-bo-neutral-500 hover:text-bo-neutral-700 transition-colors"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
