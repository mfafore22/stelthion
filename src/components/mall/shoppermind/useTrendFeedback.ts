'use client';

import { useEffect, useState } from 'react';

export type Verdict = 'relevant' | 'not_relevant';
export type FeedbackStatus = 'idle' | 'submitting' | 'submitted' | 'error';
export type FeedbackEntityType = 'trend' | 'signal' | 'action' | 'path' | 'competitor' | 'macro';

interface FeedbackRow {
  verdict: string;
  note: string | null;
  createdAt: string;
}

export function useTrendFeedback(
  phenomenonId: string,
  mallId: string | null,
  context?: {
    entityType?: FeedbackEntityType;
    entityLabel?: string;
    categoryIds?: string[];
    reasonCodes?: string[];
    promptContext?: string;
    generatedAnswer?: string;
    language?: string;
  },
) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<FeedbackStatus>('idle');
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(phenomenonId)}/feedback`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { row: FeedbackRow | null }) => {
        if (cancelled || !data.row) return;
        const v = data.row.verdict;
        if (v === 'relevant' || v === 'not_relevant') {
          setVerdict(v);
          setNote(data.row.note ?? '');
          setStatus('submitted');
          setEditing(false);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [phenomenonId]);

  async function submit(next: Verdict) {
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(phenomenonId)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mallId,
          verdict: next,
          note: note.trim() || undefined,
          ...context,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVerdict(next);
      setStatus('submitted');
      setEditing(false);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  return { verdict, setVerdict, note, setNote, status, editing, setEditing, error, submit };
}
