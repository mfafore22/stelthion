import { describe, expect, it } from 'vitest';
import { runShopperMindAgentGovernance } from '../engine/agents/governance.js';

describe('runShopperMindAgentGovernance', () => {
  it('keeps registered ShopperMind agents release-ready', () => {
    const report = runShopperMindAgentGovernance();

    expect(report.blockerCount).toBe(0);
    expect(report.warningCount).toBe(0);
  });
});
