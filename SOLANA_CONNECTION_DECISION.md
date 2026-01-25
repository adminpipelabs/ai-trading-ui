# Solana Wallet Connection - Decision Summary

## Recommendation: Direct Phantom Connection (No Dependencies)

**Decision:** Use native `window.solana` API instead of `@solana/wallet-adapter-react`

---

## Comparison

| Approach | Dependencies | Bundle Size | Complexity | Flexibility |
|----------|-------------|-------------|------------|-------------|
| **Direct Phantom** | None | 0 KB | Low | Phantom only |
| Wallet Adapter | 4 packages | ~500 KB | Medium | Multiple wallets |

---

## Why Direct Phantom?

### 1. **Consistency**
- Matches existing EVM pattern (`window.ethereum`)
- Same code style throughout codebase
- No new patterns to learn

### 2. **Simplicity**
- No npm installs needed
- No provider wrappers
- No context setup
- ~30 lines of code vs ~100+ with adapter

### 3. **Performance**
- Zero bundle size impact
- Faster load times
- No extra JavaScript to parse

### 4. **Market Reality**
- Phantom has 90%+ Solana wallet market share
- Most users have Phantom
- Can add adapter later if needed (non-breaking)

---

## Implementation

**Code (30 lines):**
```jsx
const connectSolanaWallet = async () => {
  if (window.solana && window.solana.isPhantom) {
    const resp = await window.solana.connect();
    setSolanaWallet(resp.publicKey.toString());
  } else {
    window.open("https://phantom.app/", "_blank");
  }
};
```

**That's it.** No providers, no wrappers, no dependencies.

---

## Migration Path (If Needed Later)

If we need more wallets (Solflare, Backpack, etc.):

1. **Option A:** Add wallet adapter alongside existing code (non-breaking)
2. **Option B:** Replace direct Phantom with adapter (1-2 hour refactor)

**Risk:** Low - both approaches use same `window.solana` API under the hood.

---

## Recommendation

✅ **Use Direct Phantom** - Ship faster, simpler code, zero dependencies.

**When to reconsider:**
- If users request other Solana wallets
- If we need advanced features (auto-connect, transaction signing UI)
- If we're building a Solana-first product

**For now:** Direct Phantom is the right choice.
