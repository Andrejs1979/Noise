# Epics

## Overview

This document breaks down the NOISE trading engine into epics, each containing user stories with acceptance criteria. Epics are organized by the implementation phases defined in the PRD.

---

## Epic 1: Project Setup

**Goal:** Initialize project structure, tooling, and Cloudflare infrastructure.

### Story 1.1: Initialize Project Structure

**As a** developer
**I want** a properly structured project with TypeScript, package.json, and tooling configured
**So that** I can begin implementing the trading engine

#### Acceptance Criteria
- [ ] Project root contains `package.json` with all dependencies
- [ ] TypeScript configured with `tsconfig.json`
- [ ] Vitest configured with `vitest.config.ts`
- [ ] Directory structure created:
  - `src/brokers/` - Broker adapters
  - `src/risk/` - Risk management
  - `src/signals/` - Signal generation
  - `src/db/` - Database layer
  - `src/api/` - API routes
  - `tests/` - Test files
  - `scripts/` - Deployment scripts

### Story 1.2: Configure Cloudflare Workers

**As a** developer
**I want** wrangler.toml configured for development and production environments
**So that** I can deploy to Cloudflare Workers

#### Acceptance Criteria
- [ ] `wrangler.toml` created with project configuration
- [ ] Development environment configured
- [ ] Production environment configured
- [ ] D1 database bindings configured for both environments
- [ ] Scheduled tasks (cron triggers) defined

### Story 1.3: Create D1 Databases

**As a** developer
**I want** development and production D1 databases created
**So that** I can persist trades, positions, and signals

#### Acceptance Criteria
- [ ] `noise-trading-dev` D1 database created
- [ ] `noise-trading-prod` D1 database created
- [ ] Database IDs recorded in `docs/INFRASTRUCTURE.md`
- [ ] Migration scripts created for all tables

### Story 1.4: Configure Secrets Management

**As a** developer
**I want** a secure way to manage API keys and credentials
**So that** sensitive data is never committed to git

#### Acceptance Criteria
- [ ] `.env.example` created with all required secrets documented
- [ ] `.gitignore` updated to exclude `.env` files
- [ ] Script to load secrets for local development created
- [ ] Documentation for setting production secrets via wrangler

---

## Epic 2: Broker Integration

**Goal:** Integrate Tradovate and Alpaca brokers with unified abstraction layer.

### Story 2.1: Define Unified Broker Types

**As a** developer
**I want** unified TypeScript types for both brokers
**So that** the rest of the system can interact with brokers agnostic of implementation

#### Acceptance Criteria
- [ ] `UnifiedOrder` type defined
- [ ] `UnifiedPosition` type defined
- [ ] `AggregatedAccount` type defined
- [ ] `BrokerAdapter` interface defined
- [ ] Asset class types (FUTURES, EQUITY) defined
- [ ] Order side and type enums defined

### Story 2.2: Implement Tradovate Authentication

**As a** developer
**I want** OAuth 2.0 authentication with Tradovate
**So that** I can authenticate and make API calls

#### Acceptance Criteria
- [ ] OAuth flow implemented (username/password → access token)
- [ ] Token refresh logic implemented
- [ ] Tokens cached in D1 with TTL
- [ ] Authentication error handling implemented
- [ ] Test connection endpoint working

### Story 2.3: Implement Tradovate Adapter

**As a** developer
**I want** a Tradovate adapter that implements the BrokerAdapter interface
**So that** I can place futures orders and query positions

#### Acceptance Criteria
- [ ] Get account info implemented
- [ ] Get open positions implemented
- [ ] Place market order implemented
- [ ] Place limit order implemented
- [ ] Cancel order implemented
- [ ] Get order status implemented
- [ ] Contract specifications defined (MNQ, MES, M2K, MCL, MGC)
- [ ] Unit tests for all operations

### Story 2.4: Implement Alpaca Adapter

**As a** developer
**I want** an Alpaca adapter that implements the BrokerAdapter interface
**So that** I can place equity orders and query positions

#### Acceptance Criteria
- [ ] Get account info implemented
- [ ] Get open positions implemented
- [ ] Place market order implemented
- [ ] Place limit order implemented
- [ ] Cancel order implemented
- [ ] Get order status implemented
- [ ] PDT status query implemented
- [ ] Unit tests for all operations

### Story 2.5: Implement Broker Manager

**As a** developer
**I want** a manager that routes orders to the correct broker
**So that** the system automatically uses Tradovate for futures and Alpaca for equities

#### Acceptance Criteria
- [ ] Broker selection based on asset class
- [ ] Aggregated account view combining both brokers
- [ ] Unified position list from both brokers
- [ ] Order routing to appropriate broker
- [ ] Fallback handling if one broker is unavailable
- [ ] Unit tests for routing logic

### Story 2.6: Test Broker Connections

**As a** developer
**I want** to verify broker connections work in paper trading
**So that** I'm confident the integration is correct before going live

#### Acceptance Criteria
- [ ] Tradovate paper trading connection verified
- [ ] Alpaca paper trading connection verified
- [ ] Test order placed and cancelled on Tradovate
- [ ] Test order placed and cancelled on Alpaca
- [ ] Position queries return correct data
- [ ] Connection errors handled gracefully

---

## Epic 3: Risk Management

**Goal:** Implement comprehensive risk management with position sizing, exposure limits, and circuit breakers.

### Story 3.1: Define Risk Configuration Types

**As a** developer
**I want** strongly-typed risk configuration
**So that** risk parameters are validated and documented

#### Acceptance Criteria
- [ ] `RiskConfig` interface defined
- [ ] Default configuration values documented
- [ ] Configuration validation implemented
- [ ] Environment-specific overrides supported

### Story 3.2: Implement Position Sizer

**As a** developer
**I want** a position sizer using Kelly criterion and volatility adjustment
**So that** position sizes are optimal for risk/reward

#### Acceptance Criteria
- [ ] Kelly criterion calculation implemented
- [ ] Fixed fractional sizing implemented
- [ ] Volatility-adjusted sizing implemented
- [ ] Signal strength adjustment implemented
- [ ] Maximum position size enforced
- [ ] Minimum and maximum order value enforced
- [ ] Unit tests for all sizing methods

### Story 3.3: Implement Exposure Manager

**As a** developer
**I want** to track and limit exposure by correlation groups
**So that** the system doesn't become over-concentrated

#### Acceptance Criteria
- [ ] Correlation groups defined (NASDAQ, S&P 500, Semiconductors, etc.)
- [ ] Current exposure calculated by group
- [ ] Concentration limits enforced
- [ ] Total exposure limits enforced
- [ ] Futures vs equities exposure tracked separately
- [ ] Blocking of new orders when limits exceeded
- [ ] Unit tests for exposure calculations

### Story 3.4: Implement Circuit Breaker

**As a** developer
**I want** circuit breakers that halt trading on losses
**So that** the system stops before significant damage occurs

#### Acceptance Criteria
- [ ] Daily loss circuit breaker implemented (5%)
- [ ] Weekly loss circuit breaker implemented (10%)
- [ ] Drawdown circuit breaker implemented (15%)
- [ ] Consecutive losses cooldown implemented
- [ ] Position limit circuit breaker implemented
- [ ] Circuit breaker state persisted to D1
- [ ] Manual reset endpoint implemented
- [ ] Auto-reset conditions defined
- [ ] Unit tests for all breaker conditions

### Story 3.5: Implement PDT Tracker

**As a** developer
**I want** to track Pattern Day Trader usage
**So that** small accounts remain compliant

#### Acceptance Criteria
- [ ] Day trades counted on rolling 5-day window
- [ ] Day trades remaining calculated
- [ ] Reserve day trades enforced (configurable)
- [ ] Futures alternatives suggested when limit approached
- [ ] PDT status persisted to D1
- [ ] Exemption detection for accounts >= $25k
- [ ] Unit tests for PDT calculations

### Story 3.6: Implement Risk Manager

**As a** developer
**I want** a centralized risk manager that orchestrates all risk checks
**So that** every order is evaluated against all risk criteria

#### Acceptance Criteria
- [ ] Pre-trade risk checks implemented
- [ ] Position size calculation integrated
- [ ] Exposure checks integrated
- [ ] Circuit breaker status checked
- [ ] PDT checks integrated for equities
- [ ] Risk decision returned (ALLOW/BLOCK/REDUCE)
- [ ] Risk events logged to audit table
- [ ] Integration tests for full risk flow

---

## Epic 4: Signal Generation

**Goal:** Implement technical indicators, trading strategies, and market regime detection.

### Story 4.1: Implement Indicator Utilities

**As a** developer
**I want** base utilities for calculating indicators
**So that** I can build technical indicators efficiently

#### Acceptance Criteria
- [ ] SMA (Simple Moving Average) implemented
- [ ] EMA (Exponential Moving Average) implemented
- [ ] Data window/buffer utility implemented
- [ ] Price data normalization utility
- [ ] Unit tests for all utilities

### Story 4.2: Implement RSI Indicator

**As a** developer
**I want** RSI (Relative Strength Index) indicator
**So that** I can identify overbought/oversold conditions

#### Acceptance Criteria
- [ ] RSI calculation implemented (period 14)
- [ ] Signal generation: LONG when RSI <= 30
- [ ] Signal generation: SHORT when RSI >= 70
- [ ] Strength based on distance from threshold
- [ ] Unit tests with known values

### Story 4.3: Implement MACD Indicator

**As a** developer
**I want** MACD (Moving Average Convergence Divergence) indicator
**So that** I can identify trend changes

#### Acceptance Criteria
- [ ] MACD line calculated (12, 26, 9)
- [ ] Signal line calculated
- [ ] Histogram calculated
- [ ] LONG signal on bullish crossover
- [ ] SHORT signal on bearish crossover
- [ ] Unit tests with known values

### Story 4.4: Implement Bollinger Bands

**As a** developer
**I want** Bollinger Bands indicator
**So that** I can identify mean reversion opportunities

#### Acceptance Criteria
- [ ] Middle band (SMA 20) calculated
- [ ] Upper and lower bands calculated (2 std dev)
- [ ] LONG signal at lower band
- [ ] SHORT signal at upper band
- [ ] Band squeeze detection for breakout
- [ ] Unit tests with known values

### Story 4.5: Implement ATR Indicator

**As a** developer
**I want** ATR (Average True Range) indicator
**So that** I can measure volatility and set stops

#### Acceptance Criteria
- [ ] ATR calculation implemented (period 14)
- [ ] Volatility percentile calculated
- [ ] Used for stop loss placement
- [ ] Used for position sizing
- [ ] Unit tests with known values

### Story 4.6: Implement ADX Indicator

**As a** developer
**I want** ADX (Average Directional Index) indicator
**So that** I can measure trend strength

#### Acceptance Criteria
- [ ] ADX calculation implemented (period 14)
- [ ] +DI and -DI calculated
- [ ] Trend strength classification (strong/weak/ranging)
- [ ] Used for regime detection
- [ ] Unit tests with known values

### Story 4.7: Implement Volume Indicators

**As a** developer
**I want** volume-based indicators
**So that** I can confirm signals with volume

#### Acceptance Criteria
- [ ] RVOL (Relative Volume) calculated
- [ ] Volume SMA calculated
- [ ] Confirmation when RVOL >= 1.5
- [ ] Unit tests with known values

### Story 4.8: Implement Momentum Strategy

**As a** developer
**I want** a momentum trading strategy
**So that** I can profit from trending markets

#### Acceptance Criteria
- [ ] Combines RSI, MACD, ADX, Volume signals
- [ ] LONG: RSI < 30 + bullish MACD + ADX >= 25 + high volume
- [ ] SHORT: RSI > 70 + bearish MACD + ADX >= 25 + high volume
- [ ] Signal strength based on indicator alignment
- [ ] Preferred in STRONG_TREND regime
- [ ] Weight: 40%

### Story 4.9: Implement Mean Reversion Strategy

**As a** developer
**I want** a mean reversion trading strategy
**So that** I can profit from ranging markets

#### Acceptance Criteria
- [ ] Combines Bollinger Bands, RSI, divergence
- [ ] LONG: Price at lower BB + RSI < 30
- [ ] SHORT: Price at upper BB + RSI > 70
- [ ] Divergence detection (optional enhancement)
- [ ] Preferred in RANGING regime
- [ ] Weight: 30%

### Story 4.10: Implement Breakout Strategy

**As a** developer
**I want** a breakout trading strategy
**So that** I can profit from low volatility expansion

#### Acceptance Criteria
- [ ] Detects Bollinger Band squeeze
- [ ] Entry on breakout with volume confirmation
- [ ] ADX >= 25 to confirm trend
- [ ] Preferred in LOW_VOLATILITY regime
- [ ] Weight: 30%

### Story 4.11: Implement Regime Detection

**As a** developer
**I want** to detect current market regime
**So that** I can adjust strategy selection

#### Acceptance Criteria
- [ ] STRONG_TREND_UP: ADX >= 40, +DI > -DI
- [ ] STRONG_TREND_DOWN: ADX >= 40, -DI > +DI
- [ ] WEAK_TREND: 25 <= ADX < 40
- [ ] RANGING: ADX < 25
- [ ] HIGH_VOLATILITY: ATR > 80th percentile
- [ ] LOW_VOLATILITY: ATR < 20th percentile
- [ ] Regime persisted to D1

### Story 4.12: Implement Time Filter

**As a** developer
**I want** to filter signals based on time of day
**So that** I avoid low-quality trading periods

#### Acceptance Criteria
- [ ] Block first 15 minutes (9:30-9:45 AM ET)
- [ ] Block last 15 minutes (3:45-4:00 PM ET)
- [ ] Pre-market signals reduced to 80% strength
- [ ] After-hours signals reduced to 60% strength
- [ ] Regular hours get full strength
- [ ] Configurable time zones

### Story 4.13: Implement Signal Manager

**As a** developer
**I want** a signal manager that orchestrates all signal generation
**So that** the system generates high-quality trading signals

#### Acceptance Criteria
- [ ] All indicators calculated on schedule
- [ ] All strategies evaluated
- [ ] Regime detection applied
- [ ] Time filter applied
- [ ] Multi-timeframe confirmation implemented
- [ ] Signals persisted to D1
- [ ] Signal expiration handled
- [ ] Active signals queryable
- [ ] Integration tests for full signal flow

---

## Epic 5: Persistence Layer

**Goal:** Implement database layer with migrations and repositories.

### Story 5.1: Define Database Types

**As a** developer
**I want** TypeScript types matching database schema
**So that** I have type safety when working with D1

#### Acceptance Criteria
- [ ] Trade types defined
- [ ] Position types defined
- [ ] Signal types defined
- [ ] Risk state types defined
- [ ] Metrics types defined
- [ ] Audit log types defined

### Story 5.2: Create Migration Scripts

**As a** developer
**I want** migration scripts for all database tables
**So that** I can version control the schema

#### Acceptance Criteria
- [ ] Trades table migration
- [ ] Positions table migration
- [ ] Trade history table migration
- [ ] Signals table migration
- [ ] Risk state table migration
- [ ] Daily metrics table migration
- [ ] Equity curve table migration
- [ ] Audit log table migration
- [ ] Migration tracking table
- [ ] Migrations runnable via npm script

### Story 5.3: Implement Database Manager

**As a** developer
**I want** a database manager for D1 operations
**So that** I have a consistent interface for database access

#### Acceptance Criteria
- [ ] Connection management
- [ ] Query execution wrapper
- [ ] Transaction support
- [ ] Error handling and logging
- [ ] Prepared statements support

### Story 5.4: Implement Trades Repository

**As a** developer
**I want** a repository for trade operations
**So that** I can persist and query trades

#### Acceptance Criteria
- [ ] Create trade
- [ ] Update trade status
- [ ] Get trade by ID
- [ ] Get trades by symbol
- [ ] Get trades by date range
- [ ] Get today's trades
- [ ] Get open orders

### Story 5.5: Implement Positions Repository

**As a** developer
**I want** a repository for position operations
**So that** I can persist and query positions

#### Acceptance Criteria
- [ ] Upsert position
- [ ] Get position by symbol
- [ ] Get all open positions
- [ ] Close position
- [ ] Get correlated positions

### Story 5.6: Implement Signals Repository

**As a** developer
**I want** a repository for signal operations
**So that** I can persist and query signals

#### Acceptance Criteria
- [ ] Create signal
- [ ] Get active signals
- [ ] Get signals by symbol
- [ ] Get signals by date range
- [ ] Expire old signals
- [ ] Get signal statistics

### Story 5.7: Implement Risk State Repository

**As a** developer
**I want** a repository for risk state operations
**So that** I can persist and query risk state

#### Acceptance Criteria
- [ ] Get current risk state
- [ ] Update risk state
- [ ] Reset daily/weekly state
- [ ] Update circuit breaker status
- [ ] Update PDT counters

### Story 5.8: Implement Metrics Repository

**As a** developer
**I want** a repository for metrics operations
**So that** I can persist and query performance metrics

#### Acceptance Criteria
- [ ] Record daily metrics
- [ ] Get daily metrics by date range
- [ ] Get performance summary
- [ ] Calculate win rate
- [ ] Calculate Sharpe ratio
- [ ] Get equity curve

### Story 5.9: Implement Audit Log Repository

**As a** developer
**I want** a repository for audit logging
**So that** I can track all system events

#### Acceptance Criteria
- [ ] Log event with severity
- [ ] Query logs by severity
- [ ] Query logs by date range
- [ ] Query recent logs
- [ ] Prune old logs

---

## Epic 6: API Layer

**Goal:** Implement REST API for dashboard and external integrations.

### Story 6.1: Implement Authentication Middleware

**As a** developer
**I want** Bearer token authentication
**So that** only authorized users can access the API

#### Acceptance Criteria
- [ ] Bearer token validation
- [ ] 401 response for invalid tokens
- [ ] 403 response for missing tokens
- [ ] Token configurable via environment
- [ ] Token generation utility

### Story 6.2: Implement Status Endpoint

**As a** system operator
**I want** to view full system status
**So that** I can monitor system health

#### Acceptance Criteria
- [ ] GET /api/status endpoint
- [ ] Returns: market status, circuit breaker state, active positions count
- [ ] Returns: today's P&L, last signal time
- [ ] Returns: broker connection status

### Story 6.3: Implement Account Endpoints

**As a** system operator
**I want** to view account information
**So that** I can see balances and buying power

#### Acceptance Criteria
- [ ] GET /api/account returns aggregated account info
- [ ] Returns: total equity, cash, buying power
- [ ] Returns: margin information
- [ ] Returns: PDT status

### Story 6.4: Implement Positions Endpoints

**As a** system operator
**I want** to view and sync positions
**So that** I can see current market exposure

#### Acceptance Criteria
- [ ] GET /api/positions returns all open positions
- [ ] POST /api/positions/sync syncs from brokers
- [ ] Returns: unrealized P&L for each position
- [ ] Returns: market value and quantity

### Story 6.5: Implement Trades Endpoints

**As a** system operator
**I want** to view trade history
**So that** I can analyze past trades

#### Acceptance Criteria
- [ ] GET /api/trades returns all trades with pagination
- [ ] GET /api/trades/today returns today's trades
- [ ] Query parameters: symbol, date range, status
- [ ] Returns: entry/exit prices, P&L

### Story 6.6: Implement Signals Endpoints

**As a** system operator
**I want** to view signals
**So that** I can understand why trades were entered

#### Acceptance Criteria
- [ ] GET /api/signals returns signal history
- [ ] GET /api/signals/active returns active signals
- [ ] Returns: signal direction, strength, strategy
- [ ] Returns: indicator values that generated signal

### Story 6.7: Implement Metrics Endpoints

**As a** system operator
**I want** to view performance metrics
**So that** I can evaluate system performance

#### Acceptance Criteria
- [ ] GET /api/metrics/daily returns daily metrics
- [ ] GET /api/metrics/summary returns performance summary
- [ ] Returns: win rate, profit factor, Sharpe ratio
- [ ] Returns: total trades, total P&L

### Story 6.8: Implement Risk Endpoints

**As a** system operator
**I want** to view and manage risk state
**So that** I can control circuit breakers

#### Acceptance Criteria
- [ ] GET /api/risk/state returns current risk state
- [ ] POST /api/risk/reset-circuit-breaker resets breaker
- [ ] Returns: daily/weekly P&L, drawdown
- [ ] Returns: circuit breaker status

### Story 6.9: Implement Audit Endpoint

**As a** system operator
**I want** to view audit logs
**So that** I can debug issues

#### Acceptance Criteria
- [ ] GET /api/audit returns audit logs
- [ ] Query parameters: severity, date range
- [ ] Returns: timestamp, severity, message

### Story 6.10: Implement Main Worker Entry Point

**As a** developer
**I want** the main worker that routes all requests
**So that** the API is accessible via Cloudflare Workers

#### Acceptance Criteria
- [ ] Routes configured for all endpoints
- [ ] CORS headers configured
- [ ] Error handling middleware
- [ ] Request logging
- [ ] Scheduled task handler integration

---

## Epic 7: Dashboard

**Goal:** Build React dashboard for real-time monitoring and control.

### Story 7.1: Initialize Dashboard Project

**As a** developer
**I want** a React + Vite project configured
**So that** I can build the dashboard

#### Acceptance Criteria
- [ ] Vite + React project created
- [ ] TypeScript configured
- [ ] Tailwind CSS configured
- [ ] Recharts installed
- [ ] Cloudflare Pages deployment configured

### Story 7.2: Create API Hooks

**As a** developer
**I want** React hooks for API calls
**So that** components can fetch data easily

#### Acceptance Criteria
- [ ] useAccount hook
- [ ] usePositions hook
- [ ] useTrades hook
- [ ] useSignals hook
- [ ] useMetrics hook
- [ ] useRiskState hook
- [ ] useAuditLogs hook
- [ ] Auto-refresh configurable

### Story 7.3: Build Layout Components

**As a** developer
**I want** base layout components
**So that** the dashboard has consistent structure

#### Acceptance Criteria
- [ ] Header with logo and navigation
- [ ] Sidebar with page links
- [ ] Main content area
- [ ] Footer with status bar
- [ ] Responsive design

### Story 7.4: Build Dashboard Page

**As a** system operator
**I want** a main dashboard page
**So that** I can see all key metrics at a glance

#### Acceptance Criteria
- [ ] Account summary card (equity, cash, P&L)
- [ ] Positions table with real-time updates
- [ ] Exposure gauge (donut chart)
- [ ] Risk metrics card
- [ ] Active signals panel
- [ ] Market status indicator

### Story 7.5: Build Trades Page

**As a** system operator
**I want** a trades page
**So that** I can review trade history

#### Acceptance Criteria
- [ ] Trade history table
- [ ] Filter by symbol, date, status
- [ ] Sort by any column
- [ ] Pagination
- [ ] Trade detail modal

### Story 7.6: Build Signals Page

**As a** system operator
**I want** a signals page
**So that** I can review signal history

#### Acceptance Criteria
- [ ] Signal history table
- [ ] Filter by symbol, strategy, date
- [ ] Strategy breakdown chart
- [ ] Win rate by strategy

### Story 7.7: Build Performance Page

**As a** system operator
**I want** a performance page
**So that** I can analyze system performance

#### Acceptance Criteria
- [ ] Equity curve chart
- [ ] Daily P&L bar chart
- [ ] Win rate metric
- [ ] Sharpe ratio metric
- [ ] Profit factor metric
- [ ] Win/Loss pie chart

### Story 7.8: Build Settings Page

**As a** system operator
**I want** a settings page
**So that** I can configure the system

#### Acceptance Criteria
- [ ] Risk configuration display
- [ ] Circuit breaker reset button
- [ ] Trading mode toggle (paper/live)
- [ ] API key management (display only)
- [ ] System status display

### Story 7.9: Implement Real-time Updates

**As a** system operator
**I want** dashboard to auto-refresh
**So that** I don't need to manually reload

#### Acceptance Criteria
- [ ] Positions refresh every 10 seconds
- [ ] Account data refresh every 30 seconds
- [ ] Risk metrics refresh every 30 seconds
- [ ] Equity curve refresh every hour
- [ ] Configurable refresh intervals

### Story 7.10: Deploy to Cloudflare Pages

**As a** developer
**I want** the dashboard deployed
**So that** I can access it from anywhere

#### Acceptance Criteria
- [ ] Build process configured
- [ ] Cloudflare Pages deployment
- [ ] Custom domain configured (optional)
- [ ] Environment variables configured
- [ ] Auto-deploy on git push

---

## Epic 8: Testing and Deployment

**Goal:** Ensure system reliability and deploy to production.

### Story 8.1: Write Unit Tests for Indicators

**As a** developer
**I want** unit tests for all indicators
**So that** I'm confident calculations are correct

#### Acceptance Criteria
- [ ] RSI tests with known values
- [ ] MACD tests with known values
- [ ] Bollinger Bands tests with known values
- [ ] ATR tests with known values
- [ ] ADX tests with known values
- [ ] Volume indicator tests
- [ ] >80% code coverage

### Story 8.2: Write Integration Tests

**As a** developer
**I want** integration tests for key workflows
**So that** components work together correctly

#### Acceptance Criteria
- [ ] Signal generation end-to-end test
- [ ] Risk check end-to-end test
- [ ] Order placement end-to-end test (paper)
- [ ] Database CRUD tests
- [ ] API endpoint tests

### Story 8.3: Deploy to Development

**As a** developer
**I want** the system deployed to development
**So that** I can test in a live environment

#### Acceptance Criteria
- [ ] Worker deployed to development
- [ ] D1 migrations run on dev database
- [ ] Secrets configured for dev
- [ ] Dashboard deployed to dev
- [ ] Scheduled tasks verified

### Story 8.4: Paper Trading Monitoring Period

**As a** system operator
**I want** to monitor paper trading for 1-2 weeks
**So that** I can verify the system works correctly

#### Acceptance Criteria
- [ ] System running for 1-2 weeks in paper mode
- [ ] Signals generated and logged
- [ ] Paper trades executed
- [ ] Performance metrics tracked
- [ ] Issues identified and fixed

### Story 8.5: Deploy to Production

**As a** developer
**I want** the system deployed to production
**So that** it can trade with real money

#### Acceptance Criteria
- [ ] D1 migrations run on prod database
- [ ] Secrets configured for prod
- [ ] Worker deployed to production
- [ ] Dashboard deployed to production
- [ ] Scheduled tasks verified
- [ ] Rollback plan documented

---

## Definition of Done

Each story is complete when:

- [ ] All acceptance criteria met
- [ ] Code reviewed (if working in team)
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Documentation updated
- [ ] No critical bugs
- [ ] Code committed to feature branch
- [ ] PR created and merged

---

## Sprint Planning

Recommended sprint breakdown:

| Sprint | Epic(s) | Duration |
|--------|---------|----------|
| Sprint 1 | Epic 1: Project Setup | 1 week |
| Sprint 2 | Epic 2: Broker Integration (Stories 1-3) | 1 week |
| Sprint 3 | Epic 2: Broker Integration (Stories 4-6) | 1 week |
| Sprint 4 | Epic 3: Risk Management | 2 weeks |
| Sprint 5 | Epic 4: Signal Generation | 2 weeks |
| Sprint 6 | Epic 5: Persistence Layer | 1 week |
| Sprint 7 | Epic 6: API Layer | 1 week |
| Sprint 8 | Epic 7: Dashboard | 2 weeks |
| Sprint 9 | Epic 8: Testing and Deployment | 2 weeks |

**Total Estimated Time: 13 weeks**
