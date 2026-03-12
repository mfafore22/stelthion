/**
 * Postal Code Details Component
 * Displays detailed information for a selected postal code
 */

'use client';

import React from 'react';
import { MallCard } from './ui/MallCard';
import { Home, MapPin } from 'lucide-react';

interface PostalCodeDetailsProps {
  postalCode: string;
  name?: string;
}

export function PostalCodeDetails({ postalCode, name }: PostalCodeDetailsProps) {
  return (
    <MallCard variant="glass">
      <div className="space-y-6">
        {/* Postal Code Header */}
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-bo-primary-50 border-bo-primary-200">
          <MapPin className="h-6 w-6 text-bo-primary-700" />
          <div>
            <h3 className="text-xl font-bold text-bo-neutral-950">
              Postal Code {postalCode}
            </h3>
            {name && (
              <p className="text-sm text-bo-neutral-600">
                {name}
              </p>
            )}
          </div>
        </div>

        {/* Information message */}
        <div className="rounded-lg bg-bo-info-light/50 p-4 border border-bo-info/15">
          <div className="flex items-start gap-3">
            <Home className="h-5 w-5 text-bo-info-dark mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-bo-neutral-700 mb-1">Postal Code Selected</h4>
              <p className="text-sm text-bo-neutral-600">
                You clicked on postal code <strong>{postalCode}</strong>. Detailed demographic data for individual postal codes will be available in a future update when integrated with Statistics Finland's demographic APIs.
              </p>
              <p className="text-sm text-bo-neutral-600 mt-2">
                Currently, you can view aggregate data by selecting a drive-time zone from the map legend.
              </p>
            </div>
          </div>
        </div>

        {/* Basic info (from boundary data) */}
        <div className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30">
          <div className="text-sm font-medium text-bo-neutral-700 mb-3">Postal Code Information</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-bo-neutral-600">Code:</span>
              <span className="font-mono font-medium text-bo-neutral-950">{postalCode}</span>
            </div>
            {name && (
              <div className="flex justify-between">
                <span className="text-bo-neutral-600">Area Name:</span>
                <span className="font-medium text-bo-neutral-950">{name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-bo-neutral-600">Boundary Source:</span>
              <span className="text-bo-neutral-700">Statistics Finland WFS</span>
            </div>
          </div>
        </div>

        {/* Future data placeholder */}
        <div className="rounded-lg bg-bo-neutral-50 p-4 border border-bo-neutral-200 border-dashed">
          <div className="text-xs font-medium text-bo-neutral-500 uppercase tracking-wider mb-2">
            Coming Soon
          </div>
          <div className="text-sm text-bo-neutral-600 space-y-1">
            <div>• Population statistics</div>
            <div>• Age distribution</div>
            <div>• Income levels</div>
            <div>• Employment data</div>
            <div>• Household composition</div>
          </div>
        </div>
      </div>
    </MallCard>
  );
}
