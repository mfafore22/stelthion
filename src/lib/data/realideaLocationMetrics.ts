import type { CatchmentDemographics, ParkingData } from '@/lib/types/transport';
import type { RealideaLocationMallId } from './realideaTransport';

type ZoneInput = [number, string[], number, number, [number, number, number, number, number], number, number, number, number, string[]];

function zone([driveTimeMinutes, postalCodes, total, households, ages, median, disposable, highIncomeShare, students, topSectors]: ZoneInput) {
  return {
    driveTimeMinutes, postalCodes,
    population: { total, households, ageGroups: { '0-14': ages[0], '15-24': ages[1], '25-44': ages[2], '45-64': ages[3], '65+': ages[4] } },
    income: { medianHouseholdIncome: median, averageDisposableIncome: disposable, highIncomeShare },
    employment: { employmentRate: 79, students, topSectors },
  };
}

export const realideaCatchments: Record<RealideaLocationMallId, CatchmentDemographics> = {
  'realidea-sello': {
    mallId: 'realidea-sello',
    zones: [
      zone([5, ['02600', '02650'], 37000, 18500, [5200, 3900, 14000, 7800, 6100], 59000, 43000, 31, 3600, ['tech', 'professionalServices', 'retail']]),
      zone([10, ['02100', '02150', '02600', '02700'], 118000, 57500, [17800, 12600, 43000, 26500, 18100], 61000, 45500, 34, 14200, ['tech', 'education', 'retail']]),
      zone([15, ['00320', '00370', '02100', '02600', '02750'], 238000, 119000, [35200, 28600, 86000, 52300, 35900], 60000, 44800, 33, 28600, ['tech', 'healthcare', 'professionalServices']]),
      zone([30, ['00100', '00200', '02100', '02600', '02700', '01600'], 790000, 405000, [111000, 97000, 292000, 169000, 121000], 58500, 44000, 32, 92000, ['tech', 'publicSector', 'retail']]),
    ],
    primaryProfile: 'urban-professional',
    spendingPotential: 78,
  },
  'realidea-tripla': {
    mallId: 'realidea-tripla',
    zones: [
      zone([5, ['00520', '00240'], 52000, 31000, [5900, 6200, 23000, 9300, 7600], 57000, 43500, 30, 8900, ['professionalServices', 'publicSector', 'retail']]),
      zone([10, ['00100', '00240', '00500', '00520', '00610'], 210000, 124000, [25000, 28500, 84000, 41000, 31500], 56000, 42500, 29, 33000, ['tech', 'creative', 'hospitality']]),
      zone([15, ['00100', '00200', '00300', '00500', '00600'], 430000, 248000, [54000, 59000, 163000, 83000, 71000], 55500, 42000, 28, 65000, ['tech', 'healthcare', 'education']]),
      zone([30, ['00100', '00200', '00500', '02100', '01300', '01600'], 1120000, 590000, [157000, 137000, 414000, 246000, 166000], 57500, 43500, 31, 126000, ['tech', 'publicSector', 'professionalServices']]),
    ],
    primaryProfile: 'urban-professional',
    spendingPotential: 82,
  },
};

const parkingBase: Record<RealideaLocationMallId, ParkingData> = {
  'realidea-sello': {
    mallId: 'realidea-sello',
    levels: [
      { id: 'P-halli', capacity: 1250, currentOccupancy: 0, monthlyContracts: 80, evChargingSpots: 34 },
      { id: 'Kattoparkki', capacity: 900, currentOccupancy: 0, monthlyContracts: 0, evChargingSpots: 18 },
      { id: 'Liityntä', capacity: 650, currentOccupancy: 0, monthlyContracts: 180, evChargingSpots: 12 },
    ],
    totalCapacity: 2800, publicSpaces: 2540, currentUtilization: 0,
    pricing: { hourlyRate: 0, dailyMax: 0, monthlyContract: 95 },
    peakHours: [{ hour: 9, avgUtilization: 28 }, { hour: 12, avgUtilization: 58 }, { hour: 16, avgUtilization: 74 }, { hour: 18, avgUtilization: 68 }, { hour: 20, avgUtilization: 42 }],
    carArrivalShare: 55,
  },
  'realidea-tripla': {
    mallId: 'realidea-tripla',
    levels: [
      { id: 'P1', capacity: 420, currentOccupancy: 0, monthlyContracts: 80, evChargingSpots: 18 },
      { id: 'P2', capacity: 520, currentOccupancy: 0, monthlyContracts: 120, evChargingSpots: 22 },
      { id: 'P3', capacity: 560, currentOccupancy: 0, monthlyContracts: 140, evChargingSpots: 18 },
      { id: 'P4', capacity: 470, currentOccupancy: 0, monthlyContracts: 90, evChargingSpots: 10 },
      { id: 'P5', capacity: 330, currentOccupancy: 0, monthlyContracts: 180, evChargingSpots: 8 },
    ],
    totalCapacity: 2300, publicSpaces: 1690, currentUtilization: 0,
    pricing: { hourlyRate: 2.8, dailyMax: 36, monthlyContract: 210 },
    peakHours: [{ hour: 8, avgUtilization: 42 }, { hour: 12, avgUtilization: 64 }, { hour: 16, avgUtilization: 81 }, { hour: 18, avgUtilization: 76 }, { hour: 20, avgUtilization: 50 }],
    carArrivalShare: 31,
  },
};

export function getRealideaParkingSnapshot(mallId: string, date: Date = new Date()): ParkingData | null {
  const base = parkingBase[mallId as RealideaLocationMallId];
  if (!base) return null;
  const hour = date.getHours();
  const day = date.getDay();
  const nearest = base.peakHours.reduce((a, b) => Math.abs(b.hour - hour) < Math.abs(a.hour - hour) ? b : a);
  const util = Math.min(96, nearest.avgUtilization * (day === 6 ? 1.12 : day === 0 ? 0.86 : 1));
  const levels = base.levels.map((l, i) => ({ ...l, currentOccupancy: Math.round(l.capacity * Math.min(96, util + i * 2 - 3) / 100) }));
  const occupied = levels.reduce((sum, l) => sum + l.currentOccupancy, 0);
  return { ...base, levels, currentUtilization: Number((occupied / base.totalCapacity * 100).toFixed(1)) };
}
