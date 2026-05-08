import {
  getIndicatorsForCountry,
  MACRO_SLOT_ORDER,
} from '@/lib/shoppermind/macro-indicators';

describe('ShopperMind macro indicators', () => {
  it('uses the same top KPI slots for Finland, Sweden, and USA', () => {
    for (const country of ['FI', 'SE', 'US']) {
      expect(getIndicatorsForCountry(country).map((indicator) => indicator.slot)).toEqual(
        MACRO_SLOT_ORDER,
      );
    }
  });

  it('has sync adapters for every top KPI slot in the MVP countries', () => {
    for (const country of ['FI', 'SE', 'US']) {
      for (const indicator of getIndicatorsForCountry(country)) {
        expect(indicator.fetch).toBeDefined();
      }
    }
  });
});
