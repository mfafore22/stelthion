export type LocalizedText =
  | { kind: 'key'; key: string; params?: Record<string, string | number | boolean> }
  | { kind: 'literal'; value: string; locale?: string };

export function textKey(
  key: string,
  params?: Record<string, string | number | boolean>,
): LocalizedText {
  return { kind: 'key', key, params };
}

export function literalText(value: string, locale?: string): LocalizedText {
  return { kind: 'literal', value, locale };
}
