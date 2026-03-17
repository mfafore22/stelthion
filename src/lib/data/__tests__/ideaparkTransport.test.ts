import {
  ideaparkParkingData,
  getIdeaparkParkingSnapshot,
  getIdeaparkLiveDepartures,
} from '../ideaparkTransport';

describe('ideaparkParkingData (static)', () => {
  it('has exactly one parking zone (outdoor lot)', () => {
    expect(ideaparkParkingData.levels).toHaveLength(1);
  });

  it('outdoor lot capacity is 3000', () => {
    expect(ideaparkParkingData.levels[0].capacity).toBe(3000);
  });

  it('totalCapacity matches the single level capacity', () => {
    expect(ideaparkParkingData.totalCapacity).toBe(ideaparkParkingData.levels[0].capacity);
  });

  it('publicSpaces equals totalCapacity (free lot, no reserved)', () => {
    expect(ideaparkParkingData.publicSpaces).toBe(ideaparkParkingData.totalCapacity);
  });

  it('EV charging spots are 57', () => {
    expect(ideaparkParkingData.levels[0].evChargingSpots).toBe(57);
  });

  it('pricing is free (all zeroes)', () => {
    expect(ideaparkParkingData.pricing.hourlyRate).toBe(0);
    expect(ideaparkParkingData.pricing.dailyMax).toBe(0);
    expect(ideaparkParkingData.pricing.monthlyContract).toBe(0);
  });

  it('car arrival share is a plausible percentage', () => {
    expect(ideaparkParkingData.carArrivalShare).toBeGreaterThan(0);
    expect(ideaparkParkingData.carArrivalShare).toBeLessThanOrEqual(100);
  });
});

describe('getIdeaparkParkingSnapshot', () => {
  it('returns exactly one level', () => {
    expect(getIdeaparkParkingSnapshot().levels).toHaveLength(1);
  });

  it('utilization is between 0 and 95', () => {
    const snap = getIdeaparkParkingSnapshot();
    expect(snap.currentUtilization).toBeGreaterThanOrEqual(0);
    expect(snap.currentUtilization).toBeLessThanOrEqual(95);
  });

  it('currentOccupancy does not exceed level capacity', () => {
    const snap = getIdeaparkParkingSnapshot();
    snap.levels.forEach((level) => {
      expect(level.currentOccupancy).toBeLessThanOrEqual(level.capacity);
      expect(level.currentOccupancy).toBeGreaterThanOrEqual(0);
    });
  });

  it('uses the provided date for calculation', () => {
    const peak = new Date('2026-03-14T15:00:00'); // Saturday 15:00
    const closed = new Date('2026-03-11T03:00:00'); // Wednesday 03:00
    const peakSnap = getIdeaparkParkingSnapshot(peak);
    const closedSnap = getIdeaparkParkingSnapshot(closed);
    expect(peakSnap.currentUtilization).toBeGreaterThan(closedSnap.currentUtilization);
  });
});

describe('getIdeaparkLiveDepartures', () => {
  const dep = getIdeaparkLiveDepartures(new Date('2026-03-11T14:00:00'));

  it('mallId is ideapark', () => {
    expect(dep.mallId).toBe('ideapark');
  });

  it('trains array is empty (trains field reserved for HSL)', () => {
    expect(dep.trains).toHaveLength(0);
  });

  it('vrTrains contains at most 8 entries', () => {
    expect(dep.vrTrains.length).toBeLessThanOrEqual(8);
  });

  it('buses contains at most 12 entries', () => {
    expect(dep.buses.length).toBeLessThanOrEqual(12);
  });

  it('each VR departure has scheduledTime in HH:MM format', () => {
    dep.vrTrains.forEach((t) => {
      expect(t.scheduledTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  it('each bus departure has scheduledTime in HH:MM format', () => {
    dep.buses.forEach((b) => {
      expect(b.scheduledTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  it('all vrTrains have type train', () => {
    dep.vrTrains.forEach((t) => expect(t.type).toBe('train'));
  });

  it('all buses have type bus', () => {
    dep.buses.forEach((b) => expect(b.type).toBe('bus'));
  });

  it('lastUpdated is a valid ISO string', () => {
    expect(() => new Date(dep.lastUpdated)).not.toThrow();
    expect(new Date(dep.lastUpdated).toISOString()).toBe(dep.lastUpdated);
  });
});
