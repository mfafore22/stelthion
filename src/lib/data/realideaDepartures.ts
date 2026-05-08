import type { LiveDeparture, LiveDepartures } from '@/lib/types/transport';
import type { RealideaLocationMallId } from './realideaTransport';

const fmt = (min: number): string => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

function departures(
  now: number,
  configs: Array<{ line: string; destination: string; interval: number; type: LiveDeparture['type']; platform?: string }>,
  window: number,
): LiveDeparture[] {
  return configs.flatMap((cfg) => {
    const count = Math.ceil(window / cfg.interval);
    return Array.from({ length: count }, (_, i) => {
      const scheduled = now + i * cfg.interval + Math.floor(Math.random() * 4);
      const delay = Math.random() < 0.18 ? Math.floor(Math.random() * 5) + 1 : 0;
      return {
        scheduledTime: fmt(scheduled),
        realTime: delay ? fmt(scheduled + delay) : undefined,
        line: cfg.line,
        destination: cfg.destination,
        platform: cfg.platform,
        delayMinutes: delay || undefined,
        type: cfg.type,
      };
    });
  }).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export function getRealideaLiveDepartures(mallId: string, date: Date = new Date()): LiveDepartures | null {
  const id = mallId as RealideaLocationMallId;
  const now = date.getHours() * 60 + date.getMinutes();
  if (id === 'realidea-sello') {
    return {
      mallId: id,
      station: 'Leppävaara asema',
      lastUpdated: date.toISOString(),
      trains: departures(now, [
        { line: 'A', destination: 'Helsinki', interval: 10, type: 'train', platform: '4' },
        { line: 'E', destination: 'Kauklahti', interval: 15, type: 'train', platform: '1' },
        { line: 'U', destination: 'Kirkkonummi', interval: 30, type: 'train', platform: '1' },
      ], 90).slice(0, 12),
      buses: departures(now, [
        { line: '200', destination: 'Elielinaukio', interval: 8, type: 'bus' },
        { line: '550', destination: 'Itäkeskus', interval: 6, type: 'bus' },
        { line: '555', destination: 'Keilaniemi', interval: 15, type: 'bus' },
      ], 60).slice(0, 12),
      vrTrains: [],
    };
  }
  if (id !== 'realidea-tripla') return null;
  return {
    mallId: id,
    station: 'Pasila asema',
    lastUpdated: date.toISOString(),
    trains: departures(now, [
      { line: 'I', destination: 'Lentoasema', interval: 10, type: 'train', platform: '8' },
      { line: 'P', destination: 'Helsinki / Airport loop', interval: 10, type: 'train', platform: '7' },
      { line: 'K', destination: 'Kerava', interval: 10, type: 'train', platform: '5' },
      { line: 'A', destination: 'Leppävaara', interval: 10, type: 'train', platform: '4' },
    ], 75).slice(0, 14),
    buses: departures(now, [
      { line: '500', destination: 'Munkkivuori', interval: 8, type: 'bus' },
      { line: '510', destination: 'Tapiola', interval: 8, type: 'bus' },
      { line: '600', destination: 'Helsinki Airport', interval: 15, type: 'bus' },
    ], 60).slice(0, 10),
    trams: departures(now, [
      { line: '7', destination: 'Länsi-Pasila', interval: 8, type: 'tram' },
      { line: '9', destination: 'Jätkäsaari', interval: 10, type: 'tram' },
      { line: '13', destination: 'Kalasatama', interval: 12, type: 'tram' },
    ], 60).slice(0, 10),
    vrTrains: departures(now, [
      { line: 'IC', destination: 'Tampere', interval: 30, type: 'train', platform: '9' },
      { line: 'IC', destination: 'Turku', interval: 60, type: 'train', platform: '3' },
      { line: 'Z', destination: 'Lahti', interval: 30, type: 'train', platform: '6' },
    ], 120).slice(0, 8),
  };
}
