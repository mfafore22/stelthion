interface Props {
  term: string;
  glossary: Record<string, string>;
  children?: React.ReactNode;
}

export function Term({ term, glossary, children }: Props) {
  const definition = glossary[term];
  if (!definition) return <>{children ?? term}</>;
  return (
    <abbr
      title={definition}
      className="cursor-help underline decoration-dotted decoration-bo-neutral-400 underline-offset-2"
    >
      {children ?? term}
    </abbr>
  );
}
