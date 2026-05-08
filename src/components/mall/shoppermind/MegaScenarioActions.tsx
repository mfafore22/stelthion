import type { MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';

export function MegaScenarioActions({ scenario }: { scenario: MegaScenarioResolved }) {
  if (!scenario.actionsGeneral || scenario.actionsGeneral.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-bo-neutral-500 mb-2 font-semibold">
        {scenario.actionsGeneralLabel}
      </div>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-bo-neutral-800 leading-relaxed">
        {scenario.actionsGeneral.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
