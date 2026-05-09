import { validateAgentGovernance, type GovernanceReport } from '@stelthion/intelligence-runtime';
import { venueMindAgentDefinitions, venueMindToolDefinitions } from './agents.js';

export function venueMindGovernanceReport(): GovernanceReport & { status: 'ok' | 'blocked' } {
  const report = validateAgentGovernance(venueMindAgentDefinitions, venueMindToolDefinitions);
  return { ...report, status: report.blockerCount > 0 ? 'blocked' : 'ok' };
}
