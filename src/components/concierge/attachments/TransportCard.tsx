'use client';

import React from 'react';
import { Train, Bus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AttachmentShell } from './AttachmentShell';

interface TransportCardProps {
  data: unknown;
  title: string;
}

export function TransportCard({ data, title }: TransportCardProps) {
  const { t } = useTranslation('mall');
  if (!data) return null;

  const d = data as {
    station: string;
    trains: Array<{ scheduledTime: string; destination: string; delayMinutes?: number; line?: string }>;
    buses: Array<{ scheduledTime: string; destination: string; delayMinutes?: number; line: string }>;
  };

  return (
    <AttachmentShell title={title} tone="neutral">
      {d.trains.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1 text-[10px] font-medium text-bo-neutral-700 mb-1">
            <Train className="h-3 w-3" /> {t('concierge.attachments.transport.trains')}
          </div>
          <div className="space-y-0.5">
            {d.trains.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="font-mono text-bo-neutral-900 w-12">{t.scheduledTime}</span>
                <span className="text-bo-neutral-600 flex-1 truncate">{t.destination}</span>
                {t.delayMinutes ? (
                  <span className="text-bo-warning font-medium">+{t.delayMinutes}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {d.buses.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-bo-neutral-700 mb-1">
            <Bus className="h-3 w-3" /> {t('concierge.attachments.transport.buses')}
          </div>
          <div className="space-y-0.5">
            {d.buses.slice(0, 3).map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="font-mono text-bo-neutral-900 w-12">{b.scheduledTime}</span>
                <span className="text-bo-accent-600 font-medium w-8">{b.line}</span>
                <span className="text-bo-neutral-600 flex-1 truncate">{b.destination}</span>
                {b.delayMinutes ? (
                  <span className="text-bo-warning font-medium">+{b.delayMinutes}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </AttachmentShell>
  );
}
