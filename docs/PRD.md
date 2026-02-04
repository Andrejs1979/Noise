# PRODUCT REQUIREMENTS DOCUMENT

## NOISE
**Algorithmic Trading Engine**
Serverless Futures & Equities Trading Platform
Cloudflare Workers + D1 + Tradovate + Alpaca

---
**Version:** 1.0.0
**Date:** February 4, 2026
**Author:** CloudMind Inc.
**Status:** Implementation Ready
**Classification:** Confidential

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Broker Integration](#broker-integration)
4. [Risk Management](#risk-management)
5. [Signal Generation](#signal-generation)
6. [Database Schema](#database-schema)
7. [API Specification](#api-specification)
8. [Dashboard](#dashboard)
9. [Deployment](#deployment)
10. [Implementation Guide](#implementation-guide)
11. [Appendix A: Configuration Reference](#appendix-a-configuration-reference)
12. [Appendix B: TypeScript Types](#appendix-b-typescript-types)

---

## Executive Summary

NOISE (Networked Optimization for Intelligent Signal Execution) is a fully serverless algorithmic trading engine designed to execute momentum, mean-reversion, and breakout strategies across micro-futures and leveraged ETFs. Built on Cloudflare's edge infrastructure, NOISE eliminates traditional server management while providing institutional-grade risk management and signal generation capabilities.

### Key Value Proposition

NOISE provides automated trading with a 10% monthly return target while maintaining strict risk controls including 2% max risk per trade, 5% daily loss limits, and multi-layer circuit breakers. The dual-broker architecture enables futures trading without Pattern Day Trader restrictions while maintaining equity market access.

### Core Objectives

- Achieve consistent 10% monthly returns through systematic signal generation
- Maintain maximum drawdown under 15% through comprehensive risk management
- Operate fully automated with minimal human intervention
- Provide real-time visibility into positions, P&L, and system health
- Scale efficiently using Cloudflare's serverless infrastructure

### Target Metrics

| Metric | Target | Risk Limit |
|--------|--------|------------|
| Monthly Return | 10% | N/A |
| Win Rate | >55% | N/A |
| Profit Factor | >1.5 | N/A |
| Maximum Drawdown | N/A | 15% |
| Daily Loss Limit | N/A | 5% |
| Weekly Loss Limit | N/A | 10% |
| Risk Per Trade | N/A | 2% |
| Sharpe Ratio | >1.5 | N/A |

---

## System Architecture

### Architecture Overview

NOISE employs a fully serverless architecture built on Cloudflare Workers, providing edge-distributed compute with automatic scaling and zero server management. The system integrates with two brokers through a unified abstraction layer, enabling intelligent order routing based on asset class.

```
+-------------------------------------------------------------+
|                    NOISE TRADING ENGINE                      |
|                Cloudflare Workers + D1 + Pages               |
+-------------------------------------------------------------+
|   +--------------+  +--------------+  +--------------+      |
|   |   SIGNAL     |  |    RISK      |  |   BROKER     |      |
|   |   MANAGER    |  |   MANAGER    |  |   MANAGER    |      |
|   |  Indicators  |  |  Position    |  |  Tradovate   |      |
|   |  Strategies  |  |  Sizing      |  |  (Futures)   |      |
|   |  Regime      |  |  Exposure    |  |  Alpaca      |      |
|   |  Detection   |  |  Breakers    |  |  (Equities)  |      |
|   +--------------+  +--------------+  +--------------+      |
|           |                |                |                |
|           +----------------+----------------+                |
|                            v                                 |
|   +------------------------------------------------------+  |
|   |                   CLOUDFLARE D1                       |  |
|   |   trades | positions | signals | metrics | audit     |  |
|   +------------------------------------------------------+  |
+-------------------------------------------------------------+
```

### Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| API Worker | Cloudflare Workers | HTTP endpoints for dashboard and webhooks |
| Scheduler Worker | Cloudflare Cron Triggers | Signal processing every minute |
| Database | Cloudflare D1 (SQLite) | Trades, positions, signals, metrics, audit |
| Dashboard | Cloudflare Pages (React) | Real-time monitoring and analytics |
| Futures Broker | Tradovate REST API | MNQ, MES, M2K, MCL, MGC contracts |
| Equities Broker | Alpaca REST API | TQQQ, SOXL, SPY and other ETFs |

### Dual-Broker Architecture

The system routes orders through two brokers based on asset class. Futures orders go to Tradovate while equity orders go to Alpaca. This architecture provides several advantages:

- Futures eliminate PDT restrictions (unlimited day trades with any account size)
- Micro-futures provide 20-25x leverage vs 3x for leveraged ETFs
- Lower margin requirements ($1,500-$2,100 vs $8,000+ for equivalent ETF exposure)
- Extended trading hours for futures (nearly 24/5 vs market hours only)
- Maintain equity access for specific opportunities (SOXL, individual stocks)

---

## Broker Integration

### Tradovate Integration (Futures)

Tradovate provides access to micro-futures contracts with competitive commissions and direct market access. The integration uses OAuth 2.0 authentication with automatic token refresh.

#### Supported Contracts

| Symbol | Contract | Tick Size | Tick Value | Day Margin |
|--------|----------|-----------|------------|------------|
| MNQ | Micro E-mini Nasdaq-100 | 0.25 | $0.50 | $2,100 |
| MES | Micro E-mini S&P 500 | 0.25 | $1.25 | $1,500 |
| M2K | Micro E-mini Russell 2000 | 0.10 | $0.50 | $850 |
| MCL | Micro WTI Crude Oil | 0.01 | $1.00 | $1,200 |
| MGC | Micro Gold | 0.10 | $1.00 | $1,050 |

### Alpaca Integration (Equities)

Alpaca provides commission-free equity trading with a simple API key authentication model. The integration tracks PDT status and day trade usage.

#### Supported Instruments

| Symbol | Type | Leverage | Primary Use |
|--------|------|----------|-------------|
| TQQQ | Leveraged ETF | 3x Nasdaq-100 | Momentum / Mean Reversion |
| SOXL | Leveraged ETF | 3x Semiconductors | Sector Momentum |
| SPXL | Leveraged ETF | 3x S&P 500 | Broad Market Exposure |
| TNA | Leveraged ETF | 3x Russell 2000 | Small Cap Momentum |
| SPY | ETF | 1x S&P 500 | Lower Volatility Plays |

#### PDT Tracking

The system maintains strict PDT compliance for accounts under $25,000. Day trades are tracked on a rolling 5-day window with configurable reserve requirements.

```javascript
// PDT Tracking Configuration
const PDT_CONFIG = {
  dayTradeLimit: 3,
  reserveDayTrades: 1,
  rollingWindowDays: 5,
  minEquityForExemption: 25000
};

// Futures Alternatives (no PDT restrictions)
const FUTURES_ALTERNATIVES = {
  'TQQQ': 'MNQ',
  'SPY': 'MES',
  'IWM': 'M2K'
};
```

---

## Risk Management

Risk management is the cornerstone of NOISE. The system implements multiple layers of protection to preserve capital and ensure long-term viability.

### Risk Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| maxRiskPerTradePercent | 2% | Maximum account risk per single trade |
| maxDailyLossPercent | 5% | Halt trading after daily loss exceeds this |
| maxWeeklyLossPercent | 10% | Halt trading after weekly loss exceeds this |
| maxDrawdownPercent | 15% | Maximum drawdown from equity peak |
| maxPositionPercent | 20% | Maximum single position size |
| maxConcurrentPositions | 10 | Maximum open positions at once |
| maxCorrelatedExposure | 40-50% | Maximum exposure to correlated assets |
| maxTotalExposure | 200% | Maximum total portfolio exposure |

### Position Sizing

Position sizing uses a combination of Kelly criterion, volatility adjustment, and signal strength to determine optimal trade size.

#### Kelly Criterion

```javascript
// Kelly Formula: f = (bp - q) / b
function calculateKellySize(params) {
  const { winRate, avgWinLossRatio, accountEquity } = params;
  const lossRate = 1 - winRate;
  const kelly = (avgWinLossRatio * winRate - lossRate) / avgWinLossRatio;
  const halfKelly = Math.max(0, kelly / 2);  // Half-Kelly for safety
  return accountEquity * halfKelly;
}
```

#### Volatility-Adjusted Sizing

```javascript
// Volatility-adjusted position sizing
function calculateVolatilityAdjustedSize(params) {
  const { accountEquity, atr, atrMultiple, volatilityPercentile } = params;
  const stopDistance = atr * atrMultiple;
  const riskAmount = accountEquity * 0.02;
  let quantity = riskAmount / stopDistance;

  if (volatilityPercentile > 80) quantity *= 0.5;
  else if (volatilityPercentile < 20) quantity *= 1.25;

  return { quantity, stopDistance, riskAmount };
}
```

### Correlation Groups

| Group | Symbols | Max Concentration |
|-------|---------|-------------------|
| NASDAQ | MNQ, TQQQ, QQQ, NQ | 50% |
| S&P 500 | MES, SPY, SPXL, ES | 50% |
| SEMICONDUCTORS | SOXL, SMH, NVDA, AMD | 40% |
| RUSSELL | M2K, IWM, TNA, RTY | 40% |
| CRUDE OIL | MCL, CL, USO | 30% |
| GOLD | MGC, GC, GLD | 30% |

### Circuit Breakers

| Circuit Breaker | Trigger | Action | Reset |
|-----------------|---------|--------|-------|
| Daily Loss | -5% daily P&L | Halt all trading | Next trading day |
| Weekly Loss | -10% weekly P&L | Halt all trading | Monday open |
| Drawdown | -15% from peak | Halt all trading | Manual reset |
| Consecutive Losses | 5 losses in a row | 60-min cooldown | Automatic |
| Position Limit | 10 open positions | Block new entries | Automatic |

---

## Signal Generation

The signal generation layer combines multiple technical indicators, trading strategies, and market regime detection to identify high-probability trading opportunities.

### Technical Indicators

| Indicator | Parameters | Signal Logic |
|-----------|------------|--------------|
| RSI | Period: 14 | LONG if RSI <= 30, SHORT if RSI >= 70 |
| MACD | Fast: 12, Slow: 26, Signal: 9 | LONG on bullish crossover, SHORT on bearish |
| Bollinger Bands | Period: 20, StdDev: 2 | LONG at lower band, SHORT at upper band |
| ATR | Period: 14 | Volatility filter and stop placement |
| ADX | Period: 14, Threshold: 25 | Trend strength filter (>=25 = trending) |
| Volume (RVOL) | Period: 20 | Confirmation when RVOL >= 1.5 |

### Trading Strategies

| Strategy | Indicators | Best Regime | Weight |
|----------|------------|-------------|--------|
| Momentum | RSI + MACD + ADX + Volume | Trending Markets | 40% |
| Mean Reversion | Bollinger + RSI + Divergence | Ranging Markets | 30% |
| Breakout | BB Squeeze + Volume + ADX | Low Volatility | 30% |

### Market Regime Detection

| Regime | Detection Criteria | Preferred Strategy |
|--------|-------------------|-------------------|
| STRONG_TREND_UP | ADX >= 40, +DI > -DI | Momentum (Long) |
| STRONG_TREND_DOWN | ADX >= 40, -DI > +DI | Momentum (Short) |
| WEAK_TREND | 25 <= ADX < 40 | Momentum (Reduced) |
| RANGING | ADX < 25 | Mean Reversion |
| HIGH_VOLATILITY | ATR > 80th percentile | No Trading |
| LOW_VOLATILITY | ATR < 20th percentile | Breakout |

### Multi-Timeframe Confirmation

```javascript
const TIMEFRAME_CONFIG = {
  primary: '15m',
  confirmation: ['1h', '4h']
};

function confirmSignal(signal, data) {
  let aligned = 0;
  for (const tf of TIMEFRAME_CONFIG.confirmation) {
    const sma20 = calculateSMA(data[tf], 20);
    const sma50 = calculateSMA(data[tf], 50);
    const tfTrend = sma20 > sma50 ? 'LONG' : 'SHORT';
    if (tfTrend === signal.direction) aligned++;
  }
  return (aligned / TIMEFRAME_CONFIG.confirmation.length) >= 0.5;
}
```

### Time Filters

| Session | Hours (ET) | Quality | Adjustment |
|---------|------------|---------|------------|
| Regular Hours | 9:30 AM - 4:00 PM | HIGH | Full signal strength |
| Avoid: First 15 min | 9:30 AM - 9:45 AM | BLOCKED | No new entries |
| Avoid: Last 15 min | 3:45 PM - 4:00 PM | BLOCKED | No new entries |
| Pre-Market | 4:00 AM - 9:30 AM | MEDIUM | Strength x 0.8 |
| After-Hours | 4:00 PM - 8:00 PM | LOW | Strength x 0.6 |

---

## Database Schema

NOISE uses Cloudflare D1 (SQLite) for persistence. The schema supports complete trade tracking, risk state management, performance analytics, and audit logging.

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| trades | All orders/trades | id, symbol, side, status, fill_price |
| positions | Open positions | id, symbol, quantity, entry_price |
| trade_history | Closed trades | entry_price, exit_price, net_pnl |
| signals | Generated signals | id, direction, strength, strategy |
| risk_state | Current risk state | daily_pnl, circuit_breaker |
| daily_metrics | Daily performance | date, net_pnl, win_rate |
| equity_curve | Equity snapshots | timestamp, equity, cash |
| audit_log | Event logging | timestamp, severity, message |

### Trades Table Schema

```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  broker TEXT NOT NULL,
  client_order_id TEXT UNIQUE NOT NULL,
  broker_order_id TEXT,
  side TEXT NOT NULL,
  quantity REAL NOT NULL,
  order_type TEXT NOT NULL,
  limit_price REAL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  filled_quantity REAL DEFAULT 0,
  avg_fill_price REAL,
  signal_id TEXT,
  signal_strength REAL,
  created_at INTEGER NOT NULL,
  filled_at INTEGER
);
```

### Risk State Table Schema

```sql
CREATE TABLE risk_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  start_of_day_equity REAL NOT NULL DEFAULT 0,
  start_of_week_equity REAL NOT NULL DEFAULT 0,
  peak_equity REAL NOT NULL DEFAULT 0,
  current_equity REAL NOT NULL DEFAULT 0,
  daily_pnl REAL NOT NULL DEFAULT 0,
  weekly_pnl REAL NOT NULL DEFAULT 0,
  consecutive_losses INTEGER NOT NULL DEFAULT 0,
  today_trade_count INTEGER NOT NULL DEFAULT 0,
  circuit_breaker_triggered INTEGER DEFAULT 0,
  circuit_breaker_until INTEGER,
  circuit_breaker_reason TEXT,
  day_trades_used INTEGER DEFAULT 0,
  day_trades_remaining INTEGER DEFAULT 3,
  trading_day TEXT NOT NULL,
  last_updated INTEGER NOT NULL
);
```

---

## API Specification

The API provides endpoints for the dashboard and external integrations. All endpoints require Bearer token authentication.

### Authentication

```javascript
// All requests must include Authorization header
Authorization: Bearer <API_KEY>

// Generate API key: openssl rand -hex 32
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/status | Full system status |
| GET | /api/account | Account information |
| GET | /api/positions | Open positions |
| POST | /api/positions/sync | Sync from brokers |
| GET | /api/trades | Trade history |
| GET | /api/trades/today | Today's trades |
| GET | /api/signals | Signal history |
| GET | /api/signals/active | Active signals |
| GET | /api/metrics/daily | Daily metrics |
| GET | /api/metrics/summary | Performance summary |
| GET | /api/equity/curve | Equity curve |
| GET | /api/risk/state | Risk state |
| POST | /api/risk/reset-circuit-breaker | Reset circuit breaker |
| GET | /api/audit | Audit logs |

---

## Dashboard

The dashboard provides real-time visibility into system status, positions, P&L, and performance metrics. Built with React and deployed on Cloudflare Pages.

### Dashboard Components

| Component | Purpose | Update |
|-----------|---------|--------|
| Account Summary | Equity, cash, buying power, P&L | 30s |
| Positions Table | Open positions with P&L | 10s |
| Exposure Gauge | Visual exposure breakdown | 30s |
| Risk Metrics | Drawdown, circuit breaker | 30s |
| Equity Chart | Historical equity curve | 1h |
| Signals Panel | Active signals | 30s |
| Status Bar | Market status | 30s |

### Dashboard Pages

- **Dashboard**: Main overview with all key metrics
- **Trades**: Complete trade history with filtering
- **Signals**: Signal history with strategy breakdown
- **Performance**: Win rate, Sharpe ratio, P&L charts
- **Settings**: Configuration and controls

### Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.x |
| TypeScript | Type Safety | 5.x |
| Vite | Build Tool | 5.x |
| Recharts | Charts | 2.x |
| Tailwind CSS | Styling | 3.x |
| Cloudflare Pages | Hosting | N/A |

---

## Deployment

### Infrastructure

| Component | Service | Configuration |
|-----------|---------|---------------|
| API Worker | Cloudflare Workers | noise-trading-engine |
| Database (Dev) | Cloudflare D1 | noise-trading-dev |
| Database (Prod) | Cloudflare D1 | noise-trading-prod |
| Dashboard | Cloudflare Pages | noise-dashboard |
| Secrets | Cloudflare Secrets | API keys, credentials |

### Environment Variables

```toml
# wrangler.toml
name = "noise-trading-engine"
main = "src/index.ts"
compatibility_date = "2024-02-01"

[env.development]
vars = { ENVIRONMENT = "development", TRADOVATE_LIVE = "false" }

[env.production]
vars = { ENVIRONMENT = "production", TRADOVATE_LIVE = "true" }

# Secrets (wrangler secret put)
# TRADOVATE_USERNAME, TRADOVATE_PASSWORD
# TRADOVATE_APP_ID, TRADOVATE_CID, TRADOVATE_SECRET
# ALPACA_API_KEY, ALPACA_API_SECRET, API_KEY
```

### Scheduled Jobs

| Cron | Schedule | Purpose |
|------|----------|---------|
| * * * * * | Every minute | Signal processing |
| 0 * * * * | Every hour | Equity snapshot |
| 0 21 * * 1-5 | 5 PM ET weekdays | End of day |
| 0 13 * * 1-5 | 9 AM ET weekdays | Daily reset |
| 0 10 * * 1 | 6 AM ET Monday | Weekly reset |

### Deployment Commands

```bash
# Initial setup
./scripts/setup.sh

# Development
npm run dev                    # Local worker
npm run dashboard:dev          # Local dashboard

# Database migrations
npm run db:migrate             # Development
npm run db:migrate:prod        # Production

# Deployment
./scripts/deploy.sh            # Development
./scripts/deploy.sh production # Production
```

---

## Implementation Guide

This section provides a step-by-step guide for implementing NOISE using Claude Code or similar AI-assisted development tools.

### Phase 1: Project Setup
- Create project directory structure
- Initialize npm project with dependencies
- Configure wrangler.toml for Cloudflare Workers
- Set up TypeScript configuration
- Create D1 databases for dev and prod
- Configure secrets for broker credentials

### Phase 2: Broker Integration
- Implement unified broker types
- Build TradovateAdapter with OAuth
- Build AlpacaAdapter with API key auth
- Create BrokerManager for routing
- Test paper trading connections
- Verify order placement and queries

### Phase 3: Risk Management
- Define risk configuration types
- Implement PositionSizer with Kelly
- Build ExposureManager with correlations
- Create CircuitBreaker protection
- Implement PDTTracker
- Build RiskManager orchestration

### Phase 4: Signal Generation
- Implement base indicator utilities
- Build indicators (RSI, MACD, BB, ATR, ADX)
- Create trading strategies
- Implement regime detection
- Add time-of-day filter
- Build SignalManager with MTF confirmation

### Phase 5: Persistence Layer
- Define database types and schemas
- Create migration scripts
- Build DatabaseManager
- Implement all repositories
- Test data persistence

### Phase 6: API Layer
- Implement authentication middleware
- Build API route handlers
- Create main worker entry point
- Test all endpoints
- Add webhook handlers

### Phase 7: Dashboard
- Initialize React project with Vite
- Create API hooks
- Build layout components
- Implement all dashboard components
- Create dashboard pages

### Phase 8: Testing and Deployment
- Write unit tests for indicators
- Write integration tests
- Test paper trading
- Deploy to development
- Monitor 1-2 weeks paper trading
- Deploy to production

---

## Appendix A: Configuration Reference

### Risk Configuration Defaults

```javascript
const DEFAULT_RISK_CONFIG = {
  maxRiskPerTradePercent: 2,
  maxDailyLossPercent: 5,
  maxWeeklyLossPercent: 10,
  maxDrawdownPercent: 15,
  maxPositionPercent: 20,
  maxConcurrentPositions: 10,
  maxCorrelatedConcentration: 0.4,
  maxTotalExposurePercent: 200,
  maxFuturesExposurePercent: 150,
  maxEquitiesExposurePercent: 100,
  minOrderValue: 100,
  maxOrderValue: 50000,
  consecutiveLossLimit: 5,
  cooldownMinutes: 60,
  pdtReserveDayTrades: 1
};
```

### Signal Configuration Defaults

```javascript
const DEFAULT_SIGNAL_CONFIG = {
  minStrength: 0.6,
  minConfirmingIndicators: 2,
  primaryTimeframe: '15m',
  confirmationTimeframes: ['1h', '4h'],
  requireMultiTimeframeConfirmation: true,
  stopLossAtrMultiple: 2.0,
  takeProfitAtrMultiple: 3.0,
  enableRegimeFilter: true,
  enableTimeFilter: true,
  enableVolatilityFilter: true,
  strategyWeights: {
    momentum: 0.4,
    meanReversion: 0.3,
    breakout: 0.3
  }
};
```

### Contract Specifications

```javascript
const FUTURES_CONTRACTS = {
  MNQ: { symbol: 'MNQ', name: 'Micro Nasdaq-100',
         tickSize: 0.25, tickValue: 0.50, pointValue: 2.00,
         dayMargin: 2100, nightMargin: 4200 },
  MES: { symbol: 'MES', name: 'Micro S&P 500',
         tickSize: 0.25, tickValue: 1.25, pointValue: 5.00,
         dayMargin: 1500, nightMargin: 3000 },
  M2K: { symbol: 'M2K', name: 'Micro Russell 2000',
         tickSize: 0.10, tickValue: 0.50, pointValue: 5.00,
         dayMargin: 850, nightMargin: 1700 }
};
```

---

## Appendix B: TypeScript Types

### Unified Broker Types

```typescript
type AssetClass = 'FUTURES' | 'EQUITY';

interface UnifiedOrder {
  clientOrderId: string;
  symbol: string;
  assetClass: AssetClass;
  side: 'BUY' | 'SELL';
  quantity: number;
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
}

interface UnifiedPosition {
  symbol: string;
  assetClass: AssetClass;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
}

interface AggregatedAccount {
  totalEquity: number;
  totalCash: number;
  totalBuyingPower: number;
  positions: UnifiedPosition[];
  exposure: { total: number; futures: number; equities: number; };
}
```

### Signal Types

```typescript
type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';

interface IndicatorResult {
  value: number;
  signal: SignalDirection;
  strength: number;
  metadata: Record<string, any>;
}

interface Signal {
  id: string;
  symbol: string;
  timeframe: string;
  direction: SignalDirection;
  strength: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit?: number;
  source: string;
  indicators: Record<string, IndicatorResult>;
  reasons: string[];
  timestamp: number;
  expiresAt: number;
}

type MarketRegime =
  | 'STRONG_TREND_UP' | 'STRONG_TREND_DOWN'
  | 'WEAK_TREND_UP' | 'WEAK_TREND_DOWN'
  | 'RANGING' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY';
```

### Risk Types

```typescript
interface RiskConfig {
  maxRiskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxWeeklyLossPercent: number;
  maxDrawdownPercent: number;
  maxPositionPercent: number;
  maxConcurrentPositions: number;
  consecutiveLossLimit: number;
  cooldownMinutes: number;
}

interface PositionSize {
  quantity: number;
  notionalValue: number;
  riskAmount: number;
  method: 'kelly' | 'fixed' | 'volatility' | 'reduced';
}

interface CircuitBreakerStatus {
  triggered: boolean;
  reason: string | null;
  until: number | null;
  warningLevel: 'OK' | 'CAUTION' | 'DANGER';
}
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | February 4, 2026 | CloudMind Inc. | Initial release - Implementation ready |

---

**End of Document**
