# CTO: Wallet Balance Issue - Insufficient Funds

**Date:** 2026-01-29  
**Priority:** High  
**Status:** Bot stopped - needs SOL funding

---

## 🐛 Problem Identified

**Transaction Error:**
```
❌ Trade failed: Transaction simulation failed: Error processing Instruction 3: custom program error: 0x1
```

**Error Code `0x1` = Insufficient Funds**

---

## 💰 Current Situation

### Wallet Balance Issue:

**Wallet:** `BPaJfwA4iRVKjt2RoGNJGoJ26NtdFS86HX8po88W75vG`

**What happened:**
- Bot tried to execute buy trade: **0.22 SOL** ($22.37)
- Wallet likely has **< 0.22 SOL** remaining
- Previous trades + gas fees drained the wallet

### Balance Imbalance from Sell Bug:

| Trade Type | SOL | LYNK | Issue |
|------------|-----|------|-------|
| BUY $17 | -0.17 SOL | +10,000 LYNK | ✅ Correct |
| SELL (bug) | +0.00007 SOL | -0.001 LYNK | ❌ Should be $10-25 |
| SELL (bug) | +0.00007 SOL | -0.001 LYNK | ❌ Should be $10-25 |
| SELL (bug) | +0.00007 SOL | -0.001 LYNK | ❌ Should be $10-25 |

**Result:**
- ✅ Accumulated ~90k LYNK tokens from buys
- ❌ Lost SOL (only got 0.00007 SOL back per sell instead of $10-25 worth)
- ❌ Wallet now low on SOL

---

## ✅ Action Required

### Step 1: Check Wallet Balance

**Check on Solscan:**
```
https://solscan.io/account/BPaJfwA4iRVKjt2RoGNJGoJ26NtdFS86HX8po88W75vG
```

**What to verify:**
- Current SOL balance
- Current LYNK token balance
- Recent transaction history

### Step 2: Add SOL to Wallet

**If balance < 1 SOL:**
- Add **0.5-1 SOL** to the wallet
- This provides buffer for:
  - Trade execution (0.1-0.3 SOL per trade)
  - Gas fees (~0.000005 SOL per transaction)
  - Multiple trades before needing refill

**Recommended:** **1 SOL** minimum for stable operation

### Step 3: Deploy Sell Fix

**Status:** ✅ Sell fix already committed and pushed
- Commit: `642708f` (sell amount calculation fix)
- Commit: `8f61c67` (error handling)

**Verify:**
- Fix is deployed to Railway
- Bot runner code updated

### Step 4: Restart Bot

**After adding SOL:**
```bash
curl -X POST https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/start
```

**Monitor:**
- First trade should succeed
- Sell trades should be $10-25 worth (not 0.001 LYNK)
- Balance should stabilize

---

## 📊 Expected Behavior After Fix

### Before Fix (Broken):
- Buy: 0.17 SOL → 10,000 LYNK ✅
- Sell: 0.001 LYNK → 0.00007 SOL ❌

### After Fix (Working):
- Buy: 0.17 SOL → 10,000 LYNK ✅
- Sell: ~7,614 LYNK → 0.15 SOL ✅ ($15 worth)

**Result:** Balance stays stable, SOL is recycled

---

## 🔍 Additional Issues Found

### 1. Jupiter Price API 404

**Error:**
```
❌ Failed to get SOL price: Client error '404 Not Found' for url 'https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112&vsToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
```

**Status:** ✅ Handled with fallback ($100)
- Bot continues with fallback price
- Not blocking trades, but inaccurate pricing

**Future Fix:** Use quote API to get SOL price instead of price API

### 2. Transaction Simulation Failed

**Error:** `custom program error: 0x1` = Insufficient funds

**Status:** ⚠️ Needs SOL funding
- Wallet balance too low
- Add SOL before restarting

---

## 📋 Checklist for CTO

- [ ] Check wallet balance on Solscan
- [ ] Add 0.5-1 SOL to wallet if balance < 1 SOL
- [ ] Verify sell fix is deployed (commits `642708f`, `8f61c67`)
- [ ] Restart bot after funding
- [ ] Monitor first few trades
- [ ] Verify sell trades are $10-25 worth (not 0.001 LYNK)
- [ ] Check balance stabilizes (SOL recycled, not drained)

---

## 🔗 Links

- **Solscan:** https://solscan.io/account/BPaJfwA4iRVKjt2RoGNJGoJ26NtdFS86HX8po88W75vG
- **Bot Status:** https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4
- **Railway Logs:** Railway Dashboard → trading-bridge → Logs

---

**Status:** Bot stopped. Waiting for SOL funding and sell fix deployment before restart.
