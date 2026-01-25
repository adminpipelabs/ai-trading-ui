# Multi-Chain UI - Minimal Implementation Guide

**Approach:** Add-ons only, no rewrites. ~100 lines total.

---

## Exact Locations & Code

### 1. Chain Badge Component (NEW - Add after line 110)

**Location:** After `EXCHANGES` array, before `MOCK_CLIENTS`

```jsx
// ========== CHAIN BADGE COMPONENT ==========
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
    {chain === "solana" ? "◎" : "⟠"} {chain?.toUpperCase() || "EVM"}
  </span>
);
```

---

### 2. Wallet Connection State (Add in AdminDashboard function)

**Location:** Line ~2900, add after existing useState hooks

```jsx
// Add after line 2907 (after messagesEndRef)
const [evmWallet, setEvmWallet] = useState(null);
const [solanaWallet, setSolanaWallet] = useState(null);
const [activeChain, setActiveChain] = useState("all"); // "all" | "evm" | "solana"
```

**Wallet connection functions** (add after state, before metrics):

```jsx
// Wallet connection handlers
const connectEVMWallet = async () => {
  if (!window.ethereum) {
    alert('Please install MetaMask');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setEvmWallet(accounts[0]);
    localStorage.setItem('evm_wallet', accounts[0]);
  } catch (error) {
    console.error('EVM connection error:', error);
    alert('Failed to connect wallet');
  }
};

const connectSolanaWallet = async () => {
  // Check for Phantom wallet
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      const address = resp.publicKey.toString();
      setSolanaWallet(address);
      localStorage.setItem('solana_wallet', address);
    } catch (error) {
      // User rejected connection
      if (error.code === 4001) {
        console.log('User rejected Phantom connection');
      } else {
        console.error('Solana connection error:', error);
        alert('Failed to connect Phantom wallet');
      }
    }
  } else {
    // Open Phantom install page
    const install = confirm('Phantom wallet not found. Open Phantom website to install?');
    if (install) {
      window.open('https://phantom.app/', '_blank');
    }
  }
};

// Load wallets on mount
useEffect(() => {
  const savedEvm = localStorage.getItem('evm_wallet');
  const savedSolana = localStorage.getItem('solana_wallet');
  if (savedEvm) setEvmWallet(savedEvm);
  if (savedSolana) setSolanaWallet(savedSolana);
}, []);
```

---

### 3. Wallet Buttons in Sidebar Header

**Location:** Line ~3162, replace the user info section

**Find this block (around line 3162-3171):**
```jsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#d97706' }}>A</div>
    <div className="flex flex-col">
      <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Admin User</span>
      <span className="text-xs" style={{ color: theme.textMuted }}>{user.email}</span>
    </div>
  </div>
  <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
</div>
```

**Replace with:**
```jsx
{/* Wallet Connections */}
<div className="mb-4 space-y-2">
  {/* EVM Wallet */}
  <div 
    onClick={connectEVMWallet}
    style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 8, 
      padding: "6px 12px", 
      background: evmWallet ? "#627EEA15" : theme.bgInput, 
      borderRadius: 8, 
      cursor: "pointer",
      border: evmWallet ? "1px solid #627EEA40" : `1px solid ${theme.border}`
    }}
  >
    <span>⟠</span>
    {evmWallet ? (
      <div className="flex-1">
        <div style={{ fontSize: 11, color: theme.textMuted }}>EVM</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#627EEA" }}>{evmWallet.slice(0,6)}...{evmWallet.slice(-4)}</div>
      </div>
    ) : (
      <span style={{ fontSize: 13, color: theme.textMuted }}>Connect EVM</span>
    )}
  </div>

  {/* Solana Wallet */}
  <div 
    onClick={connectSolanaWallet}
    style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 8, 
      padding: "6px 12px", 
      background: solanaWallet ? "#9945FF15" : theme.bgInput, 
      borderRadius: 8, 
      cursor: "pointer",
      border: solanaWallet ? "1px solid #9945FF40" : `1px solid ${theme.border}`
    }}
  >
    <span>◎</span>
    {solanaWallet ? (
      <div className="flex-1">
        <div style={{ fontSize: 11, color: theme.textMuted }}>Solana</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#9945FF" }}>{solanaWallet.slice(0,4)}...{solanaWallet.slice(-4)}</div>
      </div>
    ) : (
      <span style={{ fontSize: 13, color: theme.textMuted }}>Connect Solana</span>
    )}
  </div>
</div>

<div className="flex items-center justify-between">
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#d97706' }}>A</div>
    <div className="flex flex-col">
      <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Admin User</span>
      <span className="text-xs" style={{ color: theme.textMuted }}>{user.email}</span>
    </div>
  </div>
  <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
</div>
```

---

### 4. Chain Filter Above Bot List

**Location:** Line ~2833, add after "Create Bot" button, before loading check

**Find this (around line 2833-2838):**
```jsx
<div className="mb-6">
  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: theme.accent, color: 'white' }}>
    <Plus size={18} />Create Bot
  </button>
</div>
```

**Add after it:**
```jsx
{/* Chain Filter */}
<div className="mb-6 flex gap-2" style={{ background: theme.bgCard, padding: 4, borderRadius: 8, border: `1px solid ${theme.border}` }}>
  {[
    { id: "all", label: "All Chains" },
    { id: "evm", label: "⟠ EVM" },
    { id: "solana", label: "◎ Solana" },
  ].map(c => (
    <button
      key={c.id}
      onClick={() => setActiveChain(c.id)}
      style={{
        padding: "8px 16px",
        border: "none",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        background: activeChain === c.id ? theme.accent : "transparent",
        color: activeChain === c.id ? "white" : theme.textMuted
      }}
    >{c.label}</button>
  ))}
</div>
```

**Update BotManagementView to accept activeChain prop:**

**Find BotManagementView function (line ~2774):**
```jsx
function BotManagementView({ theme, isDark, onBack }) {
```

**Change to:**
```jsx
function BotManagementView({ theme, isDark, onBack, activeChain = "all" }) {
```

**Add filtering in bot list (around line 2859):**
```jsx
{/* Before bots.map, add filter */}
{bots
  .filter(bot => {
    // Determine chain from connector/exchange
    const chain = bot.connector === 'jupiter' || bot.exchange === 'jupiter' ? 'solana' : 'evm';
    return activeChain === "all" || chain === activeChain;
  })
  .map(bot => {
```

---

### 5. Chain Badge in Bot Display

**Location:** Line ~2865, add ChainBadge next to bot info

**Find this (around line 2864-2867):**
```jsx
<h3 className="font-semibold" style={{ color: theme.textPrimary }}>{bot.name || bot.id}</h3>
<p className="text-sm" style={{ color: theme.textMuted }}>
  {bot.strategy} • {bot.connector} • {bot.pair}
</p>
```

**Change to:**
```jsx
<div className="flex items-center gap-2">
  <h3 className="font-semibold" style={{ color: theme.textPrimary }}>{bot.name || bot.id}</h3>
  <ChainBadge chain={bot.chain || (bot.connector === 'jupiter' || bot.exchange === 'jupiter' ? 'solana' : 'evm')} />
</div>
<p className="text-sm" style={{ color: theme.textMuted }}>
  {bot.strategy} • {bot.connector} • {bot.pair}
</p>
```

---

### 6. Pass activeChain to BotManagementView

**Location:** Line ~3186, where BotManagementView is rendered

**Find:**
```jsx
<BotManagementView theme={theme} isDark={isDark} onBack={() => { setIsBotManagement(false); navigate('/'); }} />
```

**Change to:**
```jsx
<BotManagementView theme={theme} isDark={isDark} onBack={() => { setIsBotManagement(false); navigate('/'); }} activeChain={activeChain} />
```

---

### 7. Jupiter Already in EXCHANGES (No change needed!)

**Location:** Line 100 - Already exists:
```jsx
{ id: 'jupiter', name: 'Jupiter', requiresMemo: false },
```

It will automatically appear in all exchange dropdowns.

---

## Summary

| Change | Lines | Location |
|--------|-------|----------|
| ChainBadge component | ~15 | After line 110 |
| Wallet state | ~3 | Line ~2907 |
| Wallet functions | ~30 | After state |
| Wallet buttons UI | ~40 | Line ~3162 |
| Chain filter | ~20 | Line ~2833 |
| Filter bots | ~5 | Line ~2859 |
| Chain badge in bots | ~3 | Line ~2865 |
| Pass prop | ~1 | Line ~3186 |

**Total: ~117 lines added**

---

## Testing Checklist

- [ ] Chain badges appear on bots
- [ ] Wallet buttons in sidebar
- [ ] Click "Connect EVM" opens MetaMask
- [ ] Click "Connect Solana" opens Phantom
- [ ] Chain filter filters bot list
- [ ] Jupiter appears in exchange dropdowns
- [ ] No console errors

---

## Notes

- **No npm installs needed** - Uses native `window.solana` API (Phantom injects this)
- Jupiter already in EXCHANGES array (line 100) ✅
- No backend changes needed for UI
- Wallet state persists in localStorage
- Chain detection: `jupiter` connector = Solana, else = EVM
- Phantom detection: Checks `window.solana.isPhantom` for better compatibility

---

## Solana Connection Details

**Why direct Phantom (not wallet adapter)?**
- ✅ No extra dependencies (~500KB saved)
- ✅ Matches existing EVM pattern (`window.ethereum`)
- ✅ Simpler code, easier to maintain
- ✅ Phantom is the dominant Solana wallet (90%+ market share)

**If you need more wallets later:**
- Can add wallet adapter later without breaking existing code
- Direct Phantom code can coexist with adapter
