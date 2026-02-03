# EVM Bot Trading Diagnosis

**Wallet:** `0xfB3624e3296c93Fe07360a4E124a5d6b200032Ed`  
**Chain:** Polygon  
**Status:** Bot shows "running" but no trades on PolygonScan

---

## Step 1: Check Railway Logs

**Go to:** Railway Dashboard → trading-bridge service → Logs tab

### Look for Bot Startup Messages:

```
✅ Expected logs for EVM bot:
- "🚀 Starting bot {bot_id}..."
- "Chain detected: polygon (EVM)"
- "Initializing Uniswap client for polygon..."
- "✅ Uniswap client initialized"
- "📊 EVM Volume bot {bot_id} starting main loop..."
```

### Look for Trade Execution Attempts:

```
✅ Expected trade logs:
- "📊 EVM Volume bot {bot_id} - Checking daily target..."
- "Trade size: $XX.XX"
- "Side: buy" or "Side: sell"
- "🔄 Executing EVM trade..."
- "Getting quote from Uniswap..."
- "Quote received: {amount_in} → {amount_out}"
- "Checking token approval..."
- "Sending transaction..."
- "✅ Trade successful! Transaction hash: 0x..."
```

### Look for Errors:

```
❌ Common errors to watch for:
- "ERROR: Failed to get quote from Uniswap"
- "ERROR: Insufficient balance"
- "ERROR: Token approval failed"
- "ERROR: RPC error"
- "ERROR: Circuit breaker triggered"
- "ERROR: Transaction failed"
- "ERROR: Failed to initialize Uniswap client"
```

---

## Step 2: Check Bot Configuration

**Run this command:**
```bash
curl https://trading-bridge-production.up.railway.app/bots \
  -H "Authorization: Bearer YOUR_TOKEN" | \
  jq '.[] | select(.name | contains("uniswap")) | {
    id: .id,
    name: .name,
    status: .status,
    bot_type: .bot_type,
    chain: .chain,
    connector: .connector,
    config: .config,
    wallets: .wallets
  }'
```

**Verify:**
- ✅ `status: "running"`
- ✅ `bot_type: "volume"`
- ✅ `chain: "polygon"`
- ✅ `connector: "uniswap"`
- ✅ `config.base_mint`: Correct SHARP address
- ✅ `config.quote_mint`: Correct USDC Polygon address
- ✅ `wallets`: Contains wallet `0xfB3624e3296c93Fe07360a4E124a5d6b200032Ed`

---

## Step 3: Check Wallet Balance on PolygonScan

**URL:** https://polygonscan.com/address/0xfB3624e3296c93Fe07360a4E124a5d6b200032Ed

**Verify:**
- ✅ **POL (MATIC)**: > 0.01 POL (for gas)
- ✅ **USDC**: > $10 (for trades)
- ✅ **SHARP**: If selling, needs SHARP tokens

---

## Step 4: Check Bot Stats

**Run this command:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/BOT_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check:**
- `volume_today`: Should increase after trades
- `trades_today`: Should be > 0
- `last_trade_at`: Timestamp of last trade

**If all zeros/null:**
- Bot hasn't executed any trades yet
- Check logs for why

---

## Step 5: Check Bot Runner Status

**Run this command:**
```bash
curl https://trading-bridge-production.up.railway.app/health/bot-runner
```

**Expected response:**
```json
{
  "status": "healthy",
  "running_bots": 3,
  "bots": [
    {
      "id": "...",
      "name": "Sharp Foundation uniswap volume",
      "status": "running",
      "last_check": "2026-01-30T..."
    }
  ]
}
```

---

## Step 6: Timing Check

**Bot waits 15-45 minutes between trades:**
- If bot started < 15 min ago → Still waiting
- If bot started > 45 min ago → Should have traded

**Check bot start time:**
- Look in Railway logs for bot startup timestamp
- Or check `last_trade_at` in bot stats (null = never traded)

---

## Step 7: Common Issues & Solutions

### Issue: "Failed to get quote from Uniswap"
**Possible causes:**
- Token addresses incorrect
- Insufficient liquidity
- RPC endpoint down

**Solution:**
- Verify token addresses on PolygonScan
- Check Uniswap UI for pair liquidity
- Check RPC endpoint status

### Issue: "Insufficient balance"
**Possible causes:**
- Wallet doesn't have enough USDC/MATIC
- Token approval not completed

**Solution:**
- Add more USDC to wallet
- Add more MATIC for gas
- Check if Permit2 approval is working

### Issue: "Circuit breaker triggered"
**Possible causes:**
- Too many failed API calls
- Uniswap API rate limiting

**Solution:**
- Check Railway logs for circuit breaker messages
- Wait for circuit breaker to reset
- Check Uniswap API status

### Issue: "RPC error"
**Possible causes:**
- Polygon RPC endpoint down
- Rate limiting on RPC

**Solution:**
- Check Polygon RPC status
- Verify RPC endpoint in config
- Check if fallback RPC is configured

---

## Step 8: Force Bot Restart

**If bot seems stuck, restart it:**
```bash
# Stop bot
curl -X POST https://trading-bridge-production.up.railway.app/bots/BOT_ID/stop \
  -H "Authorization: Bearer YOUR_TOKEN"

# Start bot
curl -X POST https://trading-bridge-production.up.railway.app/bots/BOT_ID/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Then immediately watch Railway logs for:**
- Bot startup messages
- First trade attempt
- Any errors

---

## What to Share

**Please share:**
1. ✅ Relevant Railway log snippets (bot startup, trade attempts, errors)
2. ✅ Bot configuration (from Step 2)
3. ✅ Wallet balance (from PolygonScan)
4. ✅ Bot stats (from Step 4)
5. ✅ How long bot has been running

**This will help diagnose the issue quickly.**
