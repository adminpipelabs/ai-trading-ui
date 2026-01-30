# Bug Investigation: Sell Trades Using Wrong Amount

**Status:** 🔍 Investigation Complete - Ready for Review  
**Priority:** High  
**Date:** 2026-01-28

---

## 🐛 Bug Summary

**Sell trades are executing with dust amounts (0.001 LYNK = $0.000001) instead of configured $10-25.**

### Evidence from Solscan (wallet BPaJfwA4...):

| Time | Type | Amount | Value | Expected |
|------|------|--------|-------|----------|
| 3 hrs ago | BUY ✅ | 0.17 WSOL → 10,031 LYNK | $19.75 | ✅ Correct |
| 3 hrs ago | SELL ❌ | 0.001 LYNK → 0.07 WSOL | $0.000001 | $10-25 |
| 2 hrs ago | SELL ❌ | 0.001 LYNK → 0.07 WSOL | $0.000001 | $10-25 |
| 59 min ago | SELL ❌ | 0.001 LYNK → 0.07 WSOL | $0.000001 | $10-25 |
| 33 min ago | SELL ❌ | 0.001 LYNK → 0.07 WSOL | $0.000001 | $10-25 |

**Pattern:** All sell trades use exactly `0.001 LYNK` - suggests hardcoded test value or missing conversion.

---

## 🔍 Investigation Results

### Files Checked:

1. ✅ **`app/bot_runner.py`** - **NOT FOUND IN REPOSITORY**
   - Imported in `app/main.py` and `app/bot_routes.py`
   - File exists in production but not in repo
   - **This is likely where the bug is**

2. ✅ **`app/solana_routes.py`** - `/solana/swap` endpoint
   - Accepts `amount: int` in smallest units
   - No USD conversion logic here (expects pre-converted amount)
   - **Not the source of bug** - endpoint is correct

3. ✅ **`app/solana/jupiter_client.py`** - Jupiter API client
   - `get_quote()` expects `amount: int` in smallest units
   - No USD conversion logic
   - **Not the source of bug** - client is correct

4. ✅ **`app/bot_routes.py`** - Bot management routes
   - Imports `from app.bot_runner import bot_runner`
   - Calls `await bot_runner.start_bot(bot_id, db)`
   - **Not the source of bug** - routes are correct

### Bot Configuration (from previous checks):

```json
{
  "bot_type": "volume",
  "config": {
    "base_mint": "HZG1RVn4zcRM7zEFEVGYPGoPzPAWAj2AAdvQivfmLYNK",
    "quote_mint": "So11111111111111111111111111111111111111112",
    "daily_volume_usd": 5000,
    "min_trade_usd": 10,
    "max_trade_usd": 25,
    "slippage_bps": 50
  }
}
```

**Configuration is correct** - bot expects $10-25 trades.

---

## 🎯 Root Cause Analysis

### Most Likely Cause:

The bug is in **`app/bot_runner.py`** in the `_execute_volume_trade()` or `_run_volume_bot()` method.

**Hypothesis:** For sell trades, the code is:
1. ❌ Using hardcoded `0.001` instead of calculating from USD
2. ❌ Missing token decimals conversion (using raw 0.001 instead of 0.001 * 10^decimals)
3. ❌ Using wrong mint for price lookup (getting SOL price instead of LYNK price)
4. ❌ Not converting USD to token amount correctly

### Expected Flow (for sell):

```
1. Random trade size: $15 USD (between $10-25)
2. Get LYNK price: $0.00197 per LYNK (from Jupiter)
3. Calculate token amount: $15 / $0.00197 = 7,614 LYNK
4. Convert to smallest units: 7,614 * 10^decimals (e.g., 7,614,000,000)
5. Execute swap: LYNK → SOL
```

### Actual Flow (bug):

```
1. Random trade size: $15 USD ✅
2. Get price: ??? (might be wrong)
3. Calculate amount: 0.001 ❌ (hardcoded or wrong calculation)
4. Execute swap: 0.001 LYNK → SOL ❌
```

---

## 📍 Where to Look

### File: `app/bot_runner.py` (needs to be checked in production)

**Look for these patterns:**

1. **Sell trade amount calculation:**
   ```python
   if side == "sell":
       amount = ???  # BUG IS HERE
   ```

2. **USD to token conversion:**
   ```python
   # Should look like:
   trade_size_usd = random.uniform(min_trade_usd, max_trade_usd)
   token_price = await get_token_price(base_mint)  # LYNK price
   token_amount_usd = trade_size_usd / token_price  # LYNK tokens
   amount = int(token_amount_usd * (10 ** token_decimals))  # Smallest units
   ```

3. **Hardcoded test values:**
   ```python
   amount = 0.001  # ❌ BUG - hardcoded
   amount = 1000   # ❌ BUG - might be wrong decimals
   ```

4. **Wrong mint for price:**
   ```python
   # ❌ BUG - using quote_mint instead of base_mint
   price = await get_price(quote_mint)  # Gets SOL price
   amount = trade_size_usd / price  # Wrong!
   
   # ✅ CORRECT - use base_mint
   price = await get_price(base_mint, quote_mint)  # Gets LYNK/SOL price
   amount = trade_size_usd / price  # Correct!
   ```

---

## 🔧 Comparison: Buy vs Sell

### Buy Trade (Working ✅):

**Flow:**
1. Trade size: $15 USD
2. Input: SOL (quote_mint)
3. Get SOL price: ~$100
4. Calculate SOL amount: $15 / $100 = 0.15 SOL
5. Convert: 0.15 * 1e9 = 150,000,000 lamports
6. Execute: SOL → LYNK ✅

**Why it works:** SOL is the input, price lookup is straightforward.

### Sell Trade (Broken ❌):

**Expected Flow:**
1. Trade size: $15 USD
2. Input: LYNK (base_mint)
3. Get LYNK price: ~$0.00197 per LYNK
4. Calculate LYNK amount: $15 / $0.00197 = 7,614 LYNK
5. Convert: 7,614 * 10^decimals = smallest units
6. Execute: LYNK → SOL ✅

**Actual Flow (Bug):**
1. Trade size: $15 USD ✅
2. Input: LYNK (base_mint) ✅
3. Get price: ??? ❌ (might be wrong)
4. Calculate amount: 0.001 ❌ (hardcoded or wrong calc)
5. Execute: 0.001 LYNK → SOL ❌

**Why it fails:** 
- Amount calculation is wrong
- Might be using SOL price instead of LYNK price
- Might be hardcoded test value
- Might be missing decimals conversion

---

## 🛠️ Fix Strategy

### Step 1: Locate the Bug

**Check Railway logs for:**
```
📊 Volume bot ... - Executing sell trade...
  Trade size: $XX.XX
  Side: sell
  Amount: ???  ← Check this value
```

**Or check `app/bot_runner.py` directly:**
- Look for `_execute_volume_trade()` method
- Find sell trade amount calculation
- Compare with buy trade calculation

### Step 2: Identify the Issue

**Common bugs to check:**

1. **Hardcoded value:**
   ```python
   # ❌ BUG
   if side == "sell":
       amount = 0.001  # or 1000, or some test value
   ```

2. **Wrong price lookup:**
   ```python
   # ❌ BUG - using quote_mint
   price = await jupiter.get_price(config['quote_mint'])
   
   # ✅ CORRECT - use base_mint
   price = await jupiter.get_price(config['base_mint'], config['quote_mint'])
   ```

3. **Missing decimals:**
   ```python
   # ❌ BUG - not converting to smallest units
   amount = trade_size_usd / price
   
   # ✅ CORRECT - convert to smallest units
   token_decimals = 9  # or fetch from token metadata
   amount = int((trade_size_usd / price) * (10 ** token_decimals))
   ```

4. **Wrong calculation:**
   ```python
   # ❌ BUG - dividing by wrong value
   amount = trade_size_usd / sol_price  # Wrong!
   
   # ✅ CORRECT - divide by token price
   token_price = await jupiter.get_price(base_mint, quote_mint)
   amount = trade_size_usd / token_price
   ```

### Step 3: Fix the Code

**Expected fix (pseudo-code):**
```python
async def _execute_volume_trade(self, bot, wallet, trade_size_usd, side):
    config = bot.config
    
    if side == "buy":
        # Buy: SOL → LYNK
        input_mint = config['quote_mint']  # SOL
        output_mint = config['base_mint']  # LYNK
        
        # Get SOL price (for USD conversion)
        sol_price = await jupiter.get_price(config['quote_mint'])
        sol_amount = trade_size_usd / sol_price
        amount = int(sol_amount * 1e9)  # Convert to lamports
        
    elif side == "sell":
        # Sell: LYNK → SOL
        input_mint = config['base_mint']  # LYNK
        output_mint = config['quote_mint']  # SOL
        
        # ✅ FIX: Get LYNK price (not SOL price)
        token_price_data = await jupiter.get_price(
            config['base_mint'],  # LYNK
            config['quote_mint']   # vs SOL
        )
        token_price = token_price_data['price']  # Price per LYNK in SOL
        
        # Calculate LYNK amount needed for $X USD
        # token_price is LYNK/SOL, but we need LYNK/USD
        # So: LYNK_amount = USD / (LYNK_price_in_SOL * SOL_price_in_USD)
        sol_price = await jupiter.get_price(config['quote_mint'])  # SOL/USD
        lyk_price_usd = token_price * sol_price  # LYNK/USD
        
        token_amount = trade_size_usd / lyk_price_usd
        
        # Get token decimals (from token metadata or config)
        token_decimals = 9  # LYNK decimals (need to fetch this)
        amount = int(token_amount * (10 ** token_decimals))
    
    # Execute swap...
```

---

## 📋 Action Items for CTO

### Immediate:

1. **Check Railway logs** for bot runner execution:
   ```
   Look for: "Executing sell trade" or "Trade size: $XX"
   Check: What amount is being calculated?
   ```

2. **Access `app/bot_runner.py`** in production:
   - File might not be in repo (deployed separately?)
   - Check Railway file system or deployment
   - Look for `_execute_volume_trade()` method

3. **Compare buy vs sell logic:**
   - Buy works → use as reference
   - Sell broken → compare implementations

### Fix Priority:

1. **High:** Fix sell amount calculation
2. **Medium:** Add logging for amount calculations
3. **Low:** Add unit tests for USD → token conversion

---

## 🧪 Testing After Fix

### Test Case:

1. **Create volume bot** with:
   - `min_trade_usd: 10`
   - `max_trade_usd: 25`

2. **Start bot** and wait for sell trade

3. **Verify on Solscan:**
   - Sell trade should be $10-25 worth of LYNK
   - Not 0.001 LYNK

4. **Check logs:**
   ```
   Trade size: $XX.XX
   Side: sell
   Token price: $X.XXXX per LYNK
   Calculated amount: X,XXX LYNK
   Executing swap: X,XXX LYNK → SOL
   ```

---

## 📝 Notes

- **Buy trades work** → Use as reference implementation
- **Sell trades broken** → Amount calculation is wrong
- **Pattern:** Always 0.001 LYNK → suggests hardcoded value
- **File missing:** `bot_runner.py` not in repo, check production

---

## ✅ Next Steps

1. **CTO:** Check `app/bot_runner.py` in production
2. **CTO:** Locate sell amount calculation
3. **CTO:** Compare with buy calculation
4. **CTO:** Fix the bug (likely USD → token conversion)
5. **CTO:** Test with small trade first
6. **CTO:** Verify on Solscan

---

**Status:** Ready for CTO review and fix. No code changes made - investigation only.
