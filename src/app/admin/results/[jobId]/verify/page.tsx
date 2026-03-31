'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Users,
  Clock,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Snapshot {
  id: string;
  cameraId: string;
  zoneId: string;
  capturedAt: string;
  s3Key: string;
  imageUrl: string;
  colorSignature: string;
  sequenceIndex: number;
}

interface Review {
  verdict: string;
  notes: string | null;
  reviewedBy: string;
  createdAt: string;
}

interface Individual {
  anonymousTagId: string;
  snapshots: Snapshot[];
  review: Review | null;
}

interface VerificationData {
  job: {
    id: string;
    mallId: string;
    mode: string;
    footageDate: string;
    startTime: string;
    endTime: string;
    sampleSize: number;
    status: string;
    camera: { label: string; floor: string } | null;
    secondaryCamera: { label: string; floor: string } | null;
    originZoneId: string | null;
    destinationZoneId: string | null;
    selectedZoneIds: string | null;
    createdAt: string;
  };
  individuals: Individual[];
  totalCount: number;
  reviewedCount: number;
}

const VERDICT_STYLES = {
  match: { bg: 'bg-bo-success-light', text: 'text-bo-success-dark', border: 'border-bo-success-dark/30' },
  mismatch: { bg: 'bg-bo-error-light', text: 'text-bo-error-dark', border: 'border-bo-error-dark/30' },
  unsure: { bg: 'bg-bo-neutral-100', text: 'text-bo-neutral-600', border: 'border-bo-neutral-300' },
};

export default function VerifyPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { t } = useTranslation('admin');

  const apiKey = `/api/admin/verification/${jobId}`;
  const { data, error } = useSWR<VerificationData>(apiKey, fetcher);

  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});

  const handleVerdict = useCallback(async (anonymousTagId: string, verdict: string) => {
    setSubmitting(anonymousTagId);
    try {
      await fetch(apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousTagId,
          verdict,
          notes: noteText[anonymousTagId] || null,
        }),
      });
      mutate(apiKey);
    } finally {
      setSubmitting(null);
    }
  }, [apiKey, noteText]);

  if (error) {
    return (
      <div className="p-6">
        <BackLink jobId={jobId} />
        <p className="text-bo-error-dark text-sm mt-4">{t('verification.loadFailed', 'Failed to load verification data')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <BackLink jobId={jobId} />
        <p className="text-sm text-bo-neutral-400 mt-4">{t('verification.loading', 'Loading...')}</p>
      </div>
    );
  }

  const { job, individuals, totalCount, reviewedCount } = data;

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <BackLink jobId={jobId} />

      {/* Header */}
      <div className="bg-bo-neutral-50 border border-bo-neutral-200 rounded-xl p-5 shadow-bo-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-bo-neutral-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-bo-accent-600" />
              {t('verification.title', 'Re-ID Verification')}
            </h2>
            <p className="text-sm text-bo-neutral-500 mt-1">
              {new Date(job.footageDate).toLocaleDateString()} &middot; {job.startTime}–{job.endTime}
              {job.camera && <> &middot; {job.camera.label}</>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-bo-neutral-500">{t('verification.progress', 'Reviewed')}</p>
              <p className="text-sm font-bold text-bo-neutral-950">{reviewedCount} / {totalCount}</p>
            </div>
            <div className="w-16 h-2 bg-bo-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-bo-accent-600 rounded-full transition-all duration-500"
                style={{ width: totalCount > 0 ? `${(reviewedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <InfoCard label={t('verification.mode', 'Mode')} value={job.mode.replace('_', ' ')} />
          <InfoCard label={t('verification.sampleSize', 'Sample size')} value={String(job.sampleSize)} />
          <InfoCard label={t('verification.individuals', 'Individuals')} value={String(totalCount)} />
          <InfoCard label={t('verification.status', 'Status')} value={job.status} />
        </div>
      </div>

      {/* Individuals list */}
      {individuals.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-bo-neutral-200 bg-bo-neutral-50/50 p-8 text-center">
          <Users className="w-8 h-8 text-bo-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-bo-neutral-500">
            {t('verification.noSnapshots', 'No verification snapshots available for this job. Snapshots are pushed from the edge device after job completion.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {individuals.map((ind, idx) => {
            const isExpanded = expandedTag === ind.anonymousTagId;
            const review = ind.review;
            const verdictStyle = review ? VERDICT_STYLES[review.verdict as keyof typeof VERDICT_STYLES] : null;

            return (
              <div
                key={ind.anonymousTagId}
                className={cn(
                  'bg-bo-neutral-50 border rounded-xl shadow-bo-sm overflow-hidden transition-all duration-300',
                  review ? `${verdictStyle?.border ?? 'border-bo-neutral-200'}` : 'border-bo-neutral-200',
                )}
              >
                {/* Collapsed header */}
                <button
                  type="button"
                  onClick={() => setExpandedTag(isExpanded ? null : ind.anonymousTagId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-bo-neutral-100/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-bo-neutral-200 text-bo-neutral-600 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-bo-neutral-900">
                        {t('verification.individual', 'Individual')} #{idx + 1}
                      </p>
                      <p className="text-[10px] text-bo-neutral-400 font-mono">
                        {ind.anonymousTagId.slice(0, 12)}…
                      </p>
                    </div>
                    <span className="text-[10px] text-bo-neutral-400 ml-2">
                      {ind.snapshots.length} {t('verification.snapshots', 'snapshots')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {review && (
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-medium',
                        verdictStyle?.bg, verdictStyle?.text,
                      )}>
                        {review.verdict === 'match' && t('verification.match', 'Match')}
                        {review.verdict === 'mismatch' && t('verification.mismatch', 'Mismatch')}
                        {review.verdict === 'unsure' && t('verification.unsure', 'Unsure')}
                      </span>
                    )}
                    <ArrowRight className={cn(
                      'w-4 h-4 text-bo-neutral-400 transition-transform duration-200',
                      isExpanded && 'rotate-90',
                    )} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-bo-neutral-200 px-5 py-4 space-y-4">
                    {/* Zone sequence breadcrumb */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {ind.snapshots.map((snap, i) => (
                        <span key={snap.id} className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-bo-accent-50 text-bo-accent-600 rounded text-[10px] font-medium">
                            {snap.zoneId}
                          </span>
                          {i < ind.snapshots.length - 1 && <ArrowRight className="w-3 h-3 text-bo-neutral-300" />}
                        </span>
                      ))}
                    </div>

                    {/* Snapshot cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {ind.snapshots.map((snap) => {
                        let colors: string[] = [];
                        try { colors = JSON.parse(snap.colorSignature); } catch { /* */ }

                        return (
                          <div
                            key={snap.id}
                            className="bg-white rounded-lg border border-bo-neutral-200 p-3 shadow-sm"
                          >
                            {/* Silhouette placeholder — in production this loads from S3 pre-signed URL */}
                            <div className="w-full aspect-[2/5] bg-bo-neutral-100 rounded-lg mb-2 flex items-center justify-center border border-bo-neutral-200">
                              <div className="text-center">
                                <div className="w-10 h-24 mx-auto rounded-full bg-bo-neutral-200 relative overflow-hidden">
                                  {/* Color blocks representing the silhouette */}
                                  {colors[0] && (
                                    <div className="absolute top-0 left-0 right-0 h-1/3" style={{ backgroundColor: colors[0] }} />
                                  )}
                                  {colors[1] && (
                                    <div className="absolute top-1/3 left-0 right-0 h-1/3" style={{ backgroundColor: colors[1] }} />
                                  )}
                                  {colors[2] && (
                                    <div className="absolute top-2/3 left-0 right-0 h-1/3" style={{ backgroundColor: colors[2] }} />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Color signature bar */}
                            <div className="flex gap-0.5 mb-2">
                              {colors.map((c, i) => (
                                <div
                                  key={i}
                                  className="flex-1 h-3 rounded-sm border border-bo-neutral-200"
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>

                            {/* Metadata */}
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-bo-neutral-500 flex items-center gap-1">
                                <Video className="w-2.5 h-2.5" /> {snap.zoneId}
                              </p>
                              <p className="text-[10px] text-bo-neutral-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(snap.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Notes */}
                    <div>
                      <textarea
                        placeholder={t('verification.notesPlaceholder', 'Optional notes...')}
                        value={noteText[ind.anonymousTagId] ?? review?.notes ?? ''}
                        onChange={(e) => setNoteText((prev) => ({ ...prev, [ind.anonymousTagId]: e.target.value }))}
                        rows={2}
                        className="w-full text-xs border border-bo-neutral-200 rounded-lg px-3 py-2 bg-white text-bo-neutral-950 focus:outline-none focus:ring-1 focus:ring-bo-neutral-300 resize-none"
                      />
                    </div>

                    {/* Verdict buttons */}
                    <div className="flex items-center gap-2">
                      <VerdictButton
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        label={t('verification.match', 'Match')}
                        active={review?.verdict === 'match'}
                        variant="success"
                        disabled={submitting === ind.anonymousTagId}
                        onClick={() => handleVerdict(ind.anonymousTagId, 'match')}
                      />
                      <VerdictButton
                        icon={<XCircle className="w-4 h-4" />}
                        label={t('verification.mismatch', 'Mismatch')}
                        active={review?.verdict === 'mismatch'}
                        variant="error"
                        disabled={submitting === ind.anonymousTagId}
                        onClick={() => handleVerdict(ind.anonymousTagId, 'mismatch')}
                      />
                      <VerdictButton
                        icon={<HelpCircle className="w-4 h-4" />}
                        label={t('verification.unsure', 'Unsure')}
                        active={review?.verdict === 'unsure'}
                        variant="neutral"
                        disabled={submitting === ind.anonymousTagId}
                        onClick={() => handleVerdict(ind.anonymousTagId, 'unsure')}
                      />
                      {submitting === ind.anonymousTagId && (
                        <span className="text-[10px] text-bo-neutral-400 ml-2">{t('verification.saving', 'Saving...')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function BackLink({ jobId }: { jobId: string }) {
  const { t } = useTranslation('admin');
  return (
    <Link
      href={`/admin/results/${jobId}`}
      className="text-sm text-bo-neutral-500 hover:text-bo-neutral-950 flex items-center gap-1 transition-colors duration-200"
    >
      <ArrowLeft className="w-4 h-4" /> {t('verification.backToResults', 'Back to results')}
    </Link>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-bo-neutral-500 font-medium">{label}</p>
      <p className="text-sm font-medium text-bo-neutral-950 mt-0.5">{value}</p>
    </div>
  );
}

function VerdictButton({
  icon, label, active, variant, disabled, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  variant: 'success' | 'error' | 'neutral';
  disabled: boolean;
  onClick: () => void;
}) {
  const styles = {
    success: active
      ? 'bg-bo-success-light text-bo-success-dark border-bo-success-dark/30'
      : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-success-light/50 hover:text-bo-success-dark hover:border-bo-success-dark/20',
    error: active
      ? 'bg-bo-error-light text-bo-error-dark border-bo-error-dark/30'
      : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-error-light/50 hover:text-bo-error-dark hover:border-bo-error-dark/20',
    neutral: active
      ? 'bg-bo-neutral-200 text-bo-neutral-700 border-bo-neutral-400'
      : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-neutral-100 hover:border-bo-neutral-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:pointer-events-none',
        styles[variant],
      )}
    >
      {icon}
      {label}
    </button>
  );
}
