import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MegaSource } from '@/lib/shoppermind/megaScenario';

export function SourceLinkList({ sources }: { sources: MegaSource[] }) {
  const { t } = useTranslation('mall');
  if (!sources || sources.length === 0) return null;
  return (
    <div className="border-t border-bo-neutral-200/60 pt-3 mt-4">
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-2 font-semibold">
        {t('shoppermind.section.sources')}
      </div>
      <ul className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.id} className="text-sm leading-snug">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-baseline gap-1.5 text-bo-primary-700 hover:text-bo-primary-900 underline decoration-bo-primary-300 hover:decoration-bo-primary-700 underline-offset-2"
            >
              <span>{s.title}</span>
              <ExternalLink size={11} className="shrink-0 self-center" />
            </a>
            <span className="text-xs text-bo-neutral-500 ml-2">· {s.publisher}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
