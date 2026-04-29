import type { MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';

export function MegaScenarioActions({ scenario }: { scenario: MegaScenarioResolved }) {
  return (
    <div className="space-y-5 mt-2">
      <h3 className="text-sm font-semibold text-bo-neutral-950">{scenario.actionsLabel}</h3>

      <section>
        <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-2 font-semibold">
          {scenario.actionsGeneralLabel}
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-bo-neutral-800 leading-relaxed">
          {scenario.actionsGeneral.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      {scenario.perMall && (
        <section className="rounded-xl bg-bo-neutral-50/60 border border-bo-neutral-200/60 p-4">
          <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-1 font-semibold">
            {scenario.actionsPerMallLabel}
          </div>
          <h4 className="text-sm font-semibold text-bo-neutral-950 mb-1">
            {scenario.perMall.name}
          </h4>
          <p className="text-xs text-bo-neutral-600 mb-3 leading-relaxed">
            {scenario.perMall.context}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-bo-neutral-800 leading-relaxed">
            {scenario.perMall.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
