export function EmptyTabState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bo-surface-subtle rounded-xl border border-dashed border-bo-neutral-300 p-6">
      <div className="text-sm font-semibold text-bo-neutral-950">{title}</div>
      <p className="mt-1 text-sm leading-relaxed text-bo-neutral-600">{body}</p>
    </div>
  );
}
