# Solana Bot Implementation Plan

## Current State Analysis

✅ **Already Built:**
- Trading-bridge Solana routes (`/solana/swap`, `/solana/spread-orders`, etc.)
- Bot model exists (but designed for Hummingbot-style bots)
- Database infrastructure ready

❌ **Missing:**
- Solana-specific bot schema (bot_type, config structure)
- Bot wallets table (encrypted private keys)
- Bot trades table (trade history)
- Bot runner service (continuous execution)
- Solana bot management API endpoints
- UI components

## Implementation Strategy

### Option A: Extend Existing Bot Model (Recommended)
- Add `bot_type` column to distinguish Solana bots
- Use `config` JSONB for Solana-specific configs
- Keep compatibility with existing Hummingbot bots

### Option B: Separate SolanaBot Model
- Clean separation but more complex
- Not recommended - adds unnecessary complexity

**Decision: Option A** - Extend existing Bot model

## Implementation Phases

### Phase 1: Database Schema (30 min)
1. Add `bot_type` column to `bots` table
2. Create `bot_wallets` table
3. Create `bot_trades` table
4. Migration script

### Phase 2: Bot Management API (2 hours)
1. Create `solana_bot_routes.py`
2. CRUD endpoints for Solana bots
3. Start/stop endpoints
4. Stats endpoints

### Phase 3: Bot Runner Service (2-3 hours)
1. Create `bot_runner.py` service
2. VolumeBot implementation
3. SpreadBot implementation
4. Background task integration

### Phase 4: Security (1 hour)
1. Wallet encryption/decryption utilities
2. Secure key storage

### Phase 5: UI Components (2-3 hours)
1. Bot list view
2. Create bot modal
3. Bot config forms
4. Bot status display

## Next Steps

Starting with Phase 1: Database Schema
