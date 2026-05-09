import { NextResponse } from 'next/server';
import { ShopperMindApiError } from '@stelthion/shoppermind-client';
import type {
  PhenomenonDetail,
  PhenomenonScoreRow,
  PhenomenonSummary,
} from '@stelthion/shoppermind-client-types';

interface LegacyScore {
  date: string;
  compositeScore: number;
  velocity: number;
  acceleration: number;
  volume: number;
}

interface LegacyCount {
  signals: number;
  feedback: number;
}

function countryFromMarketId(marketId: string): string {
  return marketId.split('-').at(-1)?.toUpperCase() ?? 'FI';
}

function signalCountFromSources(
  sources: PhenomenonSummary['contributingSources'] | PhenomenonDetail['contributingSources'],
): number {
  return sources?.reduce((sum, source) => sum + source.signalCount, 0) ?? 0;
}

function toLegacyScores(scores?: PhenomenonScoreRow[]): LegacyScore[] {
  return (scores ?? []).map((score) => ({
    date: score.date,
    compositeScore: score.compositeScore,
    velocity: score.velocity,
    acceleration: score.acceleration,
    volume: score.volume,
  }));
}

export function toDashboardPhenomenon(
  phenomenon: PhenomenonSummary,
  marketId: string,
) {
  const scores = toLegacyScores(phenomenon.recentScores);
  const count: LegacyCount = {
    signals: signalCountFromSources(phenomenon.contributingSources),
    feedback: 0,
  };

  return {
    ...phenomenon,
    primaryCountry: countryFromMarketId(marketId),
    lastSignalAt: scores[0]?.date ?? new Date().toISOString(),
    scores,
    _count: count,
  };
}

export function toDashboardPhenomenonDetail(phenomenon: PhenomenonDetail) {
  const scores = toLegacyScores(phenomenon.scores);
  const count: LegacyCount = {
    signals: signalCountFromSources(phenomenon.contributingSources),
    feedback: 0,
  };

  return {
    ...phenomenon,
    lastSignalAt: phenomenon.lastSignalAt ?? scores[0]?.date ?? new Date().toISOString(),
    scores,
    signals: [],
    feedback: [],
    _count: count,
  };
}

export function shopperMindErrorJson(
  err: unknown,
  body: Record<string, unknown>,
) {
  const status = err instanceof ShopperMindApiError && err.status === 404 ? 404 : 502;
  return NextResponse.json(
    {
      ...body,
      error: err instanceof Error ? err.message : 'service error',
    },
    { status },
  );
}
