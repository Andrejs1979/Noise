/**
 * Portfolio Exposure Manager
 * Manages portfolio-level exposure limits and correlations
 */

import type { UnifiedPosition, AggregatedAccount } from '@/types/index.js';
import { createLogger } from '@/utils/index.js';

const log = createLogger('PORTFOLIO_EXPOSURE');

export interface CorrelationGroup {
  name: string;
  symbols: string[];
  maxConcentration: number; // Max % of portfolio
  correlationThreshold: number; // 0-1 correlation threshold
}

export interface PortfolioConstraints {
  maxTotalExposure: number; // Multiple of equity
  maxGrossExposure: number; // Long + Short absolute value
  maxNetGrowth: number; // Max (Long - Short) / equity
  maxNetShort: number; // Max Short / equity
  sectorConcentration: Map<string, number>; // Sector -> max concentration
  correlationGroups: CorrelationGroup[];
}

export interface ExposureViolation {
  type: 'TOTAL_EXPOSURE' | 'GROSS_EXPOSURE' | 'NET_GROWTH' | 'NET_SHORT' | 'SECTOR' | 'CORRELATION';
  severity: 'WARNING' | 'ERROR';
  message: string;
  currentValue: number;
  limitValue: number;
}

export interface PortfolioAnalysis {
  withinLimits: boolean;
  violations: ExposureViolation[];
  metrics: {
    totalExposure: number;
    totalExposurePercent: number;
    grossExposure: number;
    grossExposurePercent: number;
    netExposure: number;
    netExposurePercent: number;
    longExposure: number;
    shortExposure: number;
    netLongPercent: number;
    netShortPercent: number;
    sectorBreakdown: Map<string, { long: number; short: number; net: number; concentration: number }>;
    correlationExposure: Map<string, { exposure: number; concentration: number; limit: number }>;
  };
}

const DEFAULT_CONSTRAINTS: PortfolioConstraints = {
  maxTotalExposure: 2.5, // 250% of equity (using 2.5x leverage)
  maxGrossExposure: 3.0, // 300% gross exposure
  maxNetGrowth: 1.5, // 150% net long exposure
  maxNetShort: -0.5, // -50% net short (max 50% short)
  sectorConcentration: new Map([
    ['TECH', 0.5],
    ['FINANCIALS', 0.4],
    ['HEALTHCARE', 0.4],
    ['CONSUMER', 0.4],
    ['ENERGY', 0.4],
  ]),
  correlationGroups: [
    {
      name: 'NASDAQ',
      symbols: ['MNQ', 'MES', 'MYM', 'NQ', 'ES', 'YM', 'RTY', 'RUTY'],
      maxConcentration: 0.6,
      correlationThreshold: 0.8,
    },
    {
      name: 'LEVERAGE_ETFS',
      symbols: ['TQQQ', 'SQQQ', 'UPRO', 'SPXU', 'LABU', 'LABD'],
      maxConcentration: 0.3,
      correlationThreshold: 0.9,
    },
  ],
};

export class PortfolioExposureManager {
  private constraints: PortfolioConstraints;

  constructor(constraints?: Partial<PortfolioConstraints>) {
    this.constraints = {
      ...DEFAULT_CONSTRAINTS,
      sectorConcentration: new Map(DEFAULT_CONSTRAINTS.sectorConcentration),
      correlationGroups: [...DEFAULT_CONSTRAINTS.correlationGroups],
      ...constraints,
    };
  }

  /**
   * Analyze portfolio for exposure violations
   */
  analyzePortfolio(account: AggregatedAccount): PortfolioAnalysis {
    const violations: ExposureViolation[] = [];
    const equity = account.totalEquity;

    if (equity <= 0) {
      return {
        withinLimits: false,
        violations: [{
          type: 'TOTAL_EXPOSURE',
          severity: 'ERROR',
          message: 'Invalid equity value',
          currentValue: 0,
          limitValue: equity,
        }],
        metrics: this.calculateMetrics(account),
      };
    }

    const metrics = this.calculateMetrics(account);

    // Check total exposure
    if (metrics.totalExposurePercent > this.constraints.maxTotalExposure * 100) {
      violations.push({
        type: 'TOTAL_EXPOSURE',
        severity: 'ERROR',
        message: `Total exposure ${metrics.totalExposurePercent.toFixed(1)}% exceeds ${this.constraints.maxTotalExposure * 100}%`,
        currentValue: metrics.totalExposurePercent,
        limitValue: this.constraints.maxTotalExposure * 100,
      });
    }

    // Check gross exposure
    if (metrics.grossExposurePercent > this.constraints.maxGrossExposure * 100) {
      violations.push({
        type: 'GROSS_EXPOSURE',
        severity: 'ERROR',
        message: `Gross exposure ${metrics.grossExposurePercent.toFixed(1)}% exceeds ${this.constraints.maxGrossExposure * 100}%`,
        currentValue: metrics.grossExposurePercent,
        limitValue: this.constraints.maxGrossExposure * 100,
      });
    }

    // Check net growth
    if (metrics.netLongPercent > this.constraints.maxNetGrowth * 100) {
      violations.push({
        type: 'NET_GROWTH',
        severity: 'ERROR',
        message: `Net long exposure ${metrics.netLongPercent.toFixed(1)}% exceeds ${this.constraints.maxNetGrowth * 100}%`,
        currentValue: metrics.netLongPercent,
        limitValue: this.constraints.maxNetGrowth * 100,
      });
    }

    // Check net short
    if (metrics.netShortPercent < this.constraints.maxNetShort * 100) {
      violations.push({
        type: 'NET_SHORT',
        severity: 'ERROR',
        message: `Net short exposure ${metrics.netShortPercent.toFixed(1)}% exceeds limit`,
        currentValue: metrics.netShortPercent,
        limitValue: this.constraints.maxNetShort * 100,
      });
    }

    // Check correlation groups
    for (const [groupName, exposure] of metrics.correlationExposure.entries()) {
      if (exposure.concentration > exposure.limit * 100) {
        violations.push({
          type: 'CORRELATION',
          severity: 'ERROR',
          message: `${groupName} exposure ${exposure.concentration.toFixed(1)}% exceeds ${exposure.limit * 100}%`,
          currentValue: exposure.concentration,
          limitValue: exposure.limit * 100,
        });
      } else if (exposure.concentration > exposure.limit * 80) {
        // Warning at 80% of limit
        violations.push({
          type: 'CORRELATION',
          severity: 'WARNING',
          message: `${groupName} exposure approaching limit (${exposure.concentration.toFixed(1)}% of ${exposure.limit * 100}%)`,
          currentValue: exposure.concentration,
          limitValue: exposure.limit * 100,
        });
      }
    }

    return {
      withinLimits: !violations.some(v => v.severity === 'ERROR'),
      violations,
      metrics,
    };
  }

  /**
   * Check if a new order would violate exposure limits
   */
  checkOrderExposure(
    symbol: string,
    side: 'LONG' | 'SHORT',
    quantity: number,
    price: number,
    account: AggregatedAccount
  ): { allowed: boolean; violations: ExposureViolation[]; warnings: string[] } {
    const orderValue = quantity * price;
    const mockPosition: UnifiedPosition = {
      id: 'temp-check',
      symbol,
      side,
      quantity,
      entryPrice: price,
      currentPrice: price,
      marketValue: orderValue,
      unrealizedPnl: 0,
      assetClass: 'EQUITY',
      broker: 'TRADOVATE',
    };

    const mockAccount: AggregatedAccount = {
      ...account,
      positions: [...account.positions, mockPosition],
      exposure: {
        ...account.exposure,
        total: account.exposure.total + orderValue,
        [side === 'LONG' ? 'futures' : 'equities']: account.exposure.futures + orderValue,
        [side === 'SHORT' ? 'futures' : 'equities']: account.exposure.equities + orderValue,
      },
    };

    const analysis = this.analyzePortfolio(mockAccount);
    const errors = analysis.violations.filter(v => v.severity === 'ERROR');
    const warnings = analysis.violations.filter(v => v.severity === 'WARNING');

    return {
      allowed: errors.length === 0,
      violations: errors,
      warnings: warnings.map(v => v.message),
    };
  }

  /**
   * Calculate portfolio metrics
   */
  private calculateMetrics(account: AggregatedAccount) {
    const equity = account.totalEquity;

    let longExposure = 0;
    let shortExposure = 0;

    for (const position of account.positions) {
      const value = position.marketValue || (position.quantity * position.currentPrice);
      if (position.side === 'LONG') {
        longExposure += value;
      } else {
        shortExposure += value;
      }
    }

    const totalExposure = longExposure + shortExposure;
    const netExposure = longExposure - shortExposure;
    const grossExposure = longExposure + Math.abs(shortExposure);

    // Sector breakdown (mocked - would need sector mapping)
    const sectorBreakdown = new Map<string, { long: number; short: number; net: number; concentration: number }>();
    sectorBreakdown.set('FUTURES', {
      long: account.exposure.futures,
      short: 0,
      net: account.exposure.futures,
      concentration: (account.exposure.futures / equity) * 100,
    });
    sectorBreakdown.set('EQUITIES', {
      long: account.exposure.equities,
      short: 0,
      net: account.exposure.equities,
      concentration: (account.exposure.equities / equity) * 100,
    });

    // Correlation group exposure
    const correlationExposure = new Map<string, { exposure: number; concentration: number; limit: number }>();
    for (const group of this.constraints.correlationGroups) {
      const groupExposure = account.positions
        .filter(p => group.symbols.includes(p.symbol))
        .reduce((sum, p) => sum + (p.marketValue || (p.quantity * p.currentPrice)), 0);
      correlationExposure.set(group.name, {
        exposure: groupExposure,
        concentration: (groupExposure / equity) * 100,
        limit: group.maxConcentration * 100,
      });
    }

    return {
      totalExposure,
      totalExposurePercent: (totalExposure / equity) * 100,
      grossExposure,
      grossExposurePercent: (grossExposure / equity) * 100,
      netExposure,
      netExposurePercent: (netExposure / equity) * 100,
      longExposure,
      shortExposure,
      netLongPercent: (netExposure / equity) * 100,
      netShortPercent: (Math.abs(Math.min(0, netExposure)) / equity) * 100,
      sectorBreakdown,
      correlationExposure,
    };
  }

  /**
   * Get concentration risk for a symbol
   */
  getSymbolConcentration(symbol: string, account: AggregatedAccount): number {
    const equity = account.totalEquity;
    const symbolExposure = account.positions
      .filter(p => p.symbol === symbol)
      .reduce((sum, p) => sum + (p.marketValue || (p.quantity * p.currentPrice)), 0);
    return (symbolExposure / equity) * 100;
  }

  /**
   * Update constraints
   */
  updateConstraints(updates: Partial<PortfolioConstraints>): void {
    this.constraints = {
      ...this.constraints,
      ...updates,
      sectorConcentration: updates.sectorConcentration
        ? new Map([...this.constraints.sectorConcentration, ...updates.sectorConcentration])
        : this.constraints.sectorConcentration,
      correlationGroups: updates.correlationGroups
        ? [...this.constraints.correlationGroups, ...updates.correlationGroups]
        : this.constraints.correlationGroups,
    };
    log.info('Portfolio constraints updated', { updates });
  }

  /**
   * Get constraints
   */
  getConstraints(): PortfolioConstraints {
    return {
      ...this.constraints,
      sectorConcentration: new Map(this.constraints.sectorConcentration),
      correlationGroups: [...this.constraints.correlationGroups],
    };
  }
}
