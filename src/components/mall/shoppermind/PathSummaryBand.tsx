import type { MegaPath } from '@/lib/shoppermind/megaScenario';

const TONE_DOT: Record<string, string> = {
  neutraali: 'bg-bo-neutral-400', neutral: 'bg-bo-neutral-400',
  synkkä: 'bg-bo-error', dark: 'bg-bo-error',
  valoisa: 'bg-bo-success', bright: 'bg-bo-success',
};

export function PathSummaryBand({ paths }: { paths: MegaPath[] }) {
  if (!paths || paths.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
      {paths.map((p) => {
        const dot = TONE_DOT[p.tone] ?? 'bg-bo-neutral-400';
        return (
          <div
            key={p.id}
            className="rounded-lg border border-bo-neutral-200/60 bg-white/60 p-2.5 flex items-start gap-2"
          >
            <span className={`w-2 h-2 rounded-full ${dot} shrink-0 mt-1.5`} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-bo-neutral-950 leading-tight truncate">
                {p.title}
              </div>
              <p className="text-[11px] text-bo-neutral-600 leading-snug line-clamp-2 mt-0.5">
                {p.summary}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
