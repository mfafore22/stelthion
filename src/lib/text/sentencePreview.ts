export function sentencePreview(text: string, maxLength = 220): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  const clipped = clean.slice(0, maxLength);
  const end = Math.max(
    clipped.lastIndexOf('.'),
    clipped.lastIndexOf('!'),
    clipped.lastIndexOf('?'),
  );

  if (end > 80) return clipped.slice(0, end + 1);
  return clean;
}
