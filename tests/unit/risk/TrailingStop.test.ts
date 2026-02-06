/**
 * Unit Tests for Trailing Stop Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TrailingStopManager } from '../../../src/risk/TrailingStopManager.js';

describe('TrailingStopManager', () => {
  let manager: TrailingStopManager;

  beforeEach(() => {
    manager = new TrailingStopManager({
      trailPercent: 0.5,
      activationPercent: 0.3,
      minTrailPercent: 0.2,
    });
  });

  describe('initialization', () => {
    it('creates a TrailingStopManager instance', () => {
      expect(manager).toBeInstanceOf(TrailingStopManager);
    });

    it('has correct default config', () => {
      const config = manager.getConfig();
      expect(config.trailPercent).toBe(0.5);
      expect(config.activationPercent).toBe(0.3);
      expect(config.enabled).toBe(true);
    });
  });

  describe('addPosition', () => {
    it('adds a LONG position', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);

      const stop = manager.getStopLevel('pos-1');
      expect(stop).toBe(14900);
    });

    it('adds a SHORT position', () => {
      manager.addPosition('pos-2', 'MNQ', 'SHORT', 15000, 15100);

      const stop = manager.getStopLevel('pos-2');
      expect(stop).toBe(15100);
    });
  });

  describe('updateStops', () => {
    it('does not activate trailing stop below activation threshold', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);

      const prices = new Map([['MNQ', 15020]]); // Only 0.13% profit
      manager.updateStops(prices);

      const stop = manager.getStopLevel('pos-1');
      expect(stop).toBe(14900); // Should remain at initial stop
    });

    it('activates trailing stop above activation threshold', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);

      const prices = new Map([['MNQ', 15060]]); // 0.4% profit
      manager.updateStops(prices);

      const stop = manager.getStopLevel('pos-1');
      expect(stop).toBeGreaterThan(14900); // Should have moved up
    });

    it('trails stop down as price increases for LONG', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);

      const prices1 = new Map([['MNQ', 15060]]); // Activate
      manager.updateStops(prices1);
      const stop1 = manager.getStopLevel('pos-1');

      const prices2 = new Map([['MNQ', 15120]]); // Higher price (60 point move)
      manager.updateStops(prices2);
      const stop2 = manager.getStopLevel('pos-1');

      expect(stop2).toBeGreaterThan(stop1!); // Stop should have moved up
    });

    it('does not lower stop for LONG positions', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);

      const prices1 = new Map([['MNQ', 15100]]); // High price
      manager.updateStops(prices1);
      const stop1 = manager.getStopLevel('pos-1');

      const prices2 = new Map([['MNQ', 15050]]); // Price drops
      manager.updateStops(prices2);
      const stop2 = manager.getStopLevel('pos-1');

      expect(stop2).toBe(stop1); // Stop should NOT move down
    });

    it('trails stop up as price decreases for SHORT', () => {
      manager.addPosition('pos-2', 'MNQ', 'SHORT', 15000, 15100);

      const prices1 = new Map([['MNQ', 14940]]); // Activate (profit)
      manager.updateStops(prices1);
      const stop1 = manager.getStopLevel('pos-2');

      const prices2 = new Map([['MNQ', 14880]]); // Lower price (60 point move)
      manager.updateStops(prices2);
      const stop2 = manager.getStopLevel('pos-2');

      expect(stop2).toBeLessThan(stop1!); // Stop should have moved down (for short)
    });
  });

  describe('checkTrigger', () => {
    it('triggers LONG stop when price goes below', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);

      const prices = new Map([['MNQ', 15060]]);
      manager.updateStops(prices);

      const triggered = manager.checkTrigger('pos-1', 14850);
      expect(triggered).toBe(true);
    });

    it('does not trigger LONG stop when price is above', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);

      const triggered = manager.checkTrigger('pos-1', 14950);
      expect(triggered).toBe(false);
    });

    it('triggers SHORT stop when price goes above', () => {
      manager.addPosition('pos-2', 'MNQ', 'SHORT', 15000, 15100);

      const prices = new Map([['MNQ', 14940]]);
      manager.updateStops(prices);

      const triggered = manager.checkTrigger('pos-2', 15150);
      expect(triggered).toBe(true);
    });

    it('does not trigger SHORT stop when price is below', () => {
      manager.addPosition('pos-2', 'MNQ', 'SHORT', 15000, 15100);

      const triggered = manager.checkTrigger('pos-2', 15050);
      expect(triggered).toBe(false);
    });
  });

  describe('removePosition', () => {
    it('removes position from tracking', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);
      manager.removePosition('pos-1');

      const stop = manager.getStopLevel('pos-1');
      expect(stop).toBeNull();
    });
  });

  describe('getAllStops', () => {
    it('returns all tracked stops', () => {
      manager.addPosition('pos-1', 'MNQ', 'LONG', 15000, 14900);
      manager.addPosition('pos-2', 'MES', 'LONG', 4000, 3950);

      const allStops = manager.getAllStops();
      expect(allStops.size).toBe(2);
      expect(allStops.has('pos-1')).toBe(true);
      expect(allStops.has('pos-2')).toBe(true);
    });
  });
});
