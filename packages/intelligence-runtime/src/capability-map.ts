import type { IntelligenceDomain } from './runtime.js';

export type PlatformCapability =
  | 'runtime'
  | 'memory'
  | 'quality'
  | 'cache'
  | 'contracts'
  | 'observability'
  | 'release_checks';

export type DomainCapability =
  | 'source_collection'
  | 'signal_enrichment'
  | 'domain_scoring'
  | 'result_shaping'
  | 'domain_ui_copy';

export interface ServiceCapabilityMap {
  domain: IntelligenceDomain;
  platform: PlatformCapability[];
  domainOwned: DomainCapability[];
  maturity: 'demo' | 'pilot' | 'production_candidate' | 'production';
  notes?: string[];
}

export const REQUIRED_PLATFORM_CAPABILITIES: PlatformCapability[] = [
  'runtime',
  'memory',
  'quality',
  'cache',
  'contracts',
  'observability',
  'release_checks',
];

export function missingPlatformCapabilities(
  map: ServiceCapabilityMap,
): PlatformCapability[] {
  return REQUIRED_PLATFORM_CAPABILITIES.filter(
    (capability) => !map.platform.includes(capability),
  );
}

export function isRuntimeReady(map: ServiceCapabilityMap): boolean {
  return missingPlatformCapabilities(map).length === 0;
}
