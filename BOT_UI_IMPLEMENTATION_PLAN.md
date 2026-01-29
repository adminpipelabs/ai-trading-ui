# Bot UI Extension Implementation Plan

## Current State Analysis

**Location:** `src/pages/AdminDashboard.jsx` (lines 2980-3218)
- Basic bot creation modal exists
- Supports CEX bots (BitMart) only
- Simple form with: name, account, strategy, connector, pair, spreads, order amount

**API:** `src/services/api.js` (line 226)
- `createBot()` currently sends CEX format
- Needs to support DEX format with `bot_type`, `wallets`, `config`

## Implementation Strategy

### Phase 1: Extend Form State (30 min)
- Add DEX fields to state
- Add conditional logic helpers (`isDEX`, `isSolana`)

### Phase 2: Connector Dropdown Groups (30 min)
- Group connectors by CEX/DEX
- Add Jupiter to dropdown

### Phase 3: Conditional Field Rendering (1 hour)
- Hide CEX fields when DEX selected
- Show DEX fields (wallet, tokens, bot type)

### Phase 4: Bot Type Config Sections (1 hour)
- Volume config fields
- Spread config fields
- Show/hide based on bot type

### Phase 5: Update Submit Logic (30 min)
- Route to correct API format
- Handle CEX vs DEX payloads

### Phase 6: Validation (30 min)
- Solana address validation
- Token mint validation
- Required field validation

### Phase 7: Bot List Updates (30 min)
- Show chain indicator
- Show bot type icon
- Display relevant stats

## Files to Modify

1. `src/pages/AdminDashboard.jsx` - Bot creation modal
2. `src/services/api.js` - Update `createBot()` method
3. `src/components/BotList.jsx` - Add chain indicators

## Estimated Time: ~4 hours
