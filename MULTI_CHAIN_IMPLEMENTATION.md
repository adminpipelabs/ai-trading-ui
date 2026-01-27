# Multi-Chain UI Implementation - Technical Specification

## Executive Summary

**Goal:** Add EVM + Solana wallet support with chain indicators throughout UI, enabling cross-chain trading operations.

**Impact:** Medium - New feature addition, requires careful integration with existing trading flows.

**Timeline:** 2-3 weeks (includes testing and security review)

---

## 1. Architecture Overview

### Current State
- ✅ EVM support via `ethers` v6.16.0 (already installed)
- ✅ Trading Bridge API supports Jupiter (Solana DEX)
- ✅ Existing wallet connection patterns in AdminDashboard

### Proposed Changes
- Add Solana wallet adapter
- Add chain indicators and filtering
- Extend bot data model with `chain` field
- Add wallet connection state management

---

## 2. Dependencies

### New Packages Required
```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-wallets @solana/wallet-adapter-react-ui @solana/web3.js
```

**Size Impact:** ~500KB bundle increase (acceptable)

### Existing Packages Used
- `ethers` v6.16.0 (already installed) - EVM wallet operations
- `react-router-dom` - Navigation (already installed)

---

## 3. Security Considerations

### Wallet Connection Security
- ✅ **Wallet Provider Validation**: Only connect to known wallet providers (MetaMask, Phantom, etc.)
- ✅ **Transaction Signing**: All transactions require explicit user approval
- ✅ **State Isolation**: Wallet state separate from auth state
- ⚠️ **Risk**: Wallet disconnection during active trades
- **Mitigation**: Show warning when wallet disconnects, pause active bots

### Transaction Security
- All swap operations require explicit user confirmation
- Display transaction details before signing
- Show estimated gas/fees before execution
- Handle transaction failures gracefully

---

## 4. State Management

### New State Variables
```jsx
// Wallet connections
const [evmWallet, setEvmWallet] = useState(null);
const [evmAddress, setEvmAddress] = useState(null);
const [solanaWallet, setSolanaWallet] = useState(null);
const [solanaAddress, setSolanaAddress] = useState(null);

// Chain filtering
const [activeChain, setActiveChain] = useState("all"); // "all" | "evm" | "solana"

// Connection status
const [evmConnecting, setEvmConnecting] = useState(false);
const [solanaConnecting, setSolanaConnecting] = useState(false);
```

### State Persistence
- Store wallet addresses in `localStorage` (encrypted preferred)
- Reconnect on page load if wallets were previously connected
- Clear on logout

---

## 5. File Changes

### `src/pages/AdminDashboard.jsx`
**Changes:**
1. Add wallet connection UI in header
2. Add chain filter component
3. Add `ChainBadge` component
4. Filter bots by chain
5. Update bot display to show chain badges

**Lines affected:** ~200 lines added/modified

### `src/services/api.js`
**Changes:**
1. Add `jupiterQuote` function
2. Add `jupiterSwap` function (when backend ready)
3. Add wallet connection helpers

**Lines affected:** ~50 lines added

### `package.json`
**Changes:**
1. Add Solana wallet adapter packages

---

## 6. User Experience Flow

### Wallet Connection Flow
1. User clicks "Connect EVM" or "Connect Solana"
2. Show loading state
3. Trigger wallet extension popup
4. Handle approval/rejection
5. Store connection state
6. Update UI with wallet address

### Chain Filtering Flow
1. User selects chain filter ("All", "EVM", "Solana")
2. Filter bot list immediately
3. Update URL query param (optional)
4. Show empty state if no bots match

### Trading Flow (Future)
1. User selects trading pair
2. System detects chain (from exchange/connector)
3. Ensure appropriate wallet connected
4. Show transaction preview
5. User approves transaction
6. Execute swap via Trading Bridge API
7. Show transaction status

---

## 7. Error Handling

### Wallet Connection Errors
- **User rejects connection**: Show friendly message, don't persist state
- **Wallet not installed**: Show install link/instructions
- **Network mismatch**: Show network switch prompt
- **Connection timeout**: Show retry option

### Transaction Errors
- **Insufficient balance**: Show clear error with required amount
- **Transaction failed**: Show error details, allow retry
- **Network error**: Show retry option, log for debugging

---

## 8. Testing Strategy

### Unit Tests
- Wallet connection logic
- Chain filtering logic
- API call functions

### Integration Tests
- Wallet connection flow (mock wallet providers)
- Chain filtering with mock bot data
- Error handling scenarios

### Manual Testing Checklist
- [ ] Connect EVM wallet (MetaMask)
- [ ] Connect Solana wallet (Phantom)
- [ ] Disconnect wallets
- [ ] Filter bots by chain
- [ ] Refresh page (wallet persistence)
- [ ] Error scenarios (rejected connection, network errors)

---

## 9. Backend Requirements

### Trading Bridge API
- ✅ `/jupiter/quote` - Already implemented
- ⚠️ `/jupiter/swap` - Needs implementation
- ⚠️ Bot data model needs `chain` field

### API Changes Needed
```python
# Bot model update
class Bot(BaseModel):
    id: str
    name: str
    chain: str  # "evm" | "solana"
    exchange: str
    # ... existing fields
```

---

## 10. Migration Plan

### Phase 1: Foundation (Week 1)
- Install Solana wallet adapter
- Add wallet connection UI
- Add chain badges
- Add chain filter

### Phase 2: Integration (Week 2)
- Update bot data model (backend)
- Filter bots by chain
- Add wallet state persistence
- Error handling

### Phase 3: Testing & Polish (Week 3)
- Comprehensive testing
- UX improvements
- Documentation
- Security review

---

## 11. Rollback Plan

If issues arise:
1. Feature flag to disable multi-chain UI
2. Revert to single-chain mode
3. Keep wallet connection code for future use

---

## 12. Open Questions for CTO

1. **EVM Wallet Library**: Currently using `ethers` v6. Should we continue with this or consider `wagmi` for better React integration?
2. **Solana Wallet UI**: Modal (wallet-adapter-react-ui) or custom inline UI?
3. **Wallet Persistence**: Store encrypted wallet addresses or require reconnection on each session?
4. **Transaction Signing**: Should we show transaction preview modal before signing?
5. **Network Support**: Which EVM networks should we support initially? (Mainnet, Polygon, Arbitrum?)
6. **Backend Priority**: Is `/jupiter/swap` endpoint a blocker or can we ship UI first?

---

## 13. Code Examples

### Wallet Connection (EVM)
```jsx
const connectEVMWallet = async () => {
  if (!window.ethereum) {
    alert('Please install MetaMask');
    return;
  }
  
  setEvmConnecting(true);
  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    setEvmAddress(accounts[0]);
    setEvmWallet(accounts[0]);
    localStorage.setItem('evm_wallet', accounts[0]);
  } catch (error) {
    console.error('EVM connection error:', error);
    alert('Failed to connect wallet');
  } finally {
    setEvmConnecting(false);
  }
};
```

### Chain Badge Component
```jsx
const ChainBadge = ({ chain }) => (
  <span style={{
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    background: chain === "solana" ? "#9945FF20" : "#627EEA20",
    color: chain === "solana" ? "#9945FF" : "#627EEA",
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  }}>
    {chain === "solana" ? "◎" : "⟠"} {chain.toUpperCase()}
  </span>
);
```

### API Functions
```jsx
// In src/services/api.js
export const tradingBridge = {
  // ... existing functions
  
  async jupiterQuote(inputToken, outputToken, amount) {
    return apiCall(`${TRADING_BRIDGE_URL}/jupiter/quote`, {
      method: "POST",
      body: JSON.stringify({ 
        input_token: inputToken, 
        output_token: outputToken, 
        amount 
      }),
    });
  },
  
  async jupiterSwap(inputToken, outputToken, amount, walletAddress) {
    return apiCall(`${TRADING_BRIDGE_URL}/jupiter/swap`, {
      method: "POST",
      body: JSON.stringify({ 
        input_token: inputToken, 
        output_token: outputToken, 
        amount,
        wallet: walletAddress
      }),
    });
  },
};
```

---

## 14. Success Metrics

- ✅ Both wallet types connect successfully
- ✅ Chain filtering works correctly
- ✅ Bot list displays with chain badges
- ✅ No regressions in existing functionality
- ✅ Error handling covers all edge cases
- ✅ Wallet state persists across page refreshes

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wallet disconnection during trade | High | Show warning, pause bots |
| Network mismatch errors | Medium | Auto-detect, prompt switch |
| Bundle size increase | Low | Code splitting, lazy loading |
| Backend API not ready | Medium | Ship UI first, disable swap until ready |

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-24  
**Author:** Development Team  
**Review Status:** Pending CTO Approval
