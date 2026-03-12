import en from '../en/mall.json';
import fi from '../fi/mall.json';

type JsonObject = { [key: string]: string | JsonObject };

/**
 * Recursively collects all dot-notation paths from a JSON object.
 * e.g. { a: { b: 'x' } } → ['a.b']
 */
function collectPaths(obj: JsonObject, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      return collectPaths(value as JsonObject, path);
    }
    return [path];
  });
}

describe('mall locale parity (EN ↔ FI)', () => {
  const enPaths = collectPaths(en as unknown as JsonObject).sort();
  const fiPaths = collectPaths(fi as unknown as JsonObject).sort();

  it('EN and FI have the same number of keys', () => {
    expect(fiPaths.length).toBe(enPaths.length);
  });

  it('every EN key exists in FI', () => {
    const fiSet = new Set(fiPaths);
    const missingInFi = enPaths.filter((p) => !fiSet.has(p));
    expect(missingInFi).toEqual([]);
  });

  it('every FI key exists in EN', () => {
    const enSet = new Set(enPaths);
    const missingInEn = fiPaths.filter((p) => !enSet.has(p));
    expect(missingInEn).toEqual([]);
  });

  it('no EN value is an empty string', () => {
    function findEmpty(obj: JsonObject, prefix = ''): string[] {
      return Object.entries(obj).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') return findEmpty(value as JsonObject, path);
        return value === '' ? [path] : [];
      });
    }
    expect(findEmpty(en as unknown as JsonObject)).toEqual([]);
  });

  it('no FI value is an empty string', () => {
    function findEmpty(obj: JsonObject, prefix = ''): string[] {
      return Object.entries(obj).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') return findEmpty(value as JsonObject, path);
        return value === '' ? [path] : [];
      });
    }
    expect(findEmpty(fi as unknown as JsonObject)).toEqual([]);
  });
});
