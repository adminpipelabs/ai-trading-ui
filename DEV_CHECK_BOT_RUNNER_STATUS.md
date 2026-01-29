# Dev: Check Bot Runner Status

## Quick Verification Steps

### 1. Check Railway Logs

**Look for these messages (should appear on startup):**
```
Bot runner service starting...
STARTING BOT RUNNER SERVICE
Found X bot(s) with status='running'
✅ BOT RUNNER SERVICE STARTED
```

**If you DON'T see these:**
- Bot runner might not be starting
- Check for import errors
- Check if `bot_runner.py` exists

### 2. Check Bot Stats

**Run this command:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV" | jq '.stats'
```

**Expected if trades executing:**
```json
{
  "volume_today": 150.50,
  "trades_today": 1,
  "last_trade_at": "2026-01-29T12:34:56"
}
```

**If empty/null:**
- Bot runner not executing trades
- Check logs for errors

### 3. Check Bot Configuration

**Verify bot has required config:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV" | jq '.config'
```

**Required fields:**
- `base_mint` ✅
- `quote_mint` ✅
- `daily_volume_usd` ✅
- `min_trade_usd` ✅
- `max_trade_usd` ✅
- `slippage_bps` ✅

### 4. Check Bot Wallets

**Verify bot has wallets:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/wallets \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Should return array of wallets:**
```json
[
  {
    "id": "...",
    "wallet_address": "...",
    "created_at": "..."
  }
]
```

**If empty:**
- Bot has no wallets configured
- Bot runner will log: "No wallets configured for bot"

## Common Issues

### Issue: No "STARTING BOT RUNNER SERVICE" in logs

**Possible causes:**
1. Import error - `bot_runner.py` not found or has syntax errors
2. Service didn't restart after deployment
3. Exception during startup (check for "Bot runner error:")

**Fix:**
1. Restart Railway service manually
2. Check logs for import errors
3. Verify `app/bot_runner.py` exists and is correct

### Issue: Bot runner starts but no trades

**Check logs for:**
- "Volume bot {id} starting main loop..." ✅ Should see this
- "Checking daily target..." ✅ Should see this
- "No wallets configured" ❌ Bot needs wallets
- "Daily target reached" ❌ Bot sleeping until midnight
- "Failed to decrypt private key" ❌ ENCRYPTION_KEY issue
- "Failed to get quote" ❌ Jupiter API issue

### Issue: Stats not updating

**Possible causes:**
1. Trades executing but stats not saving
2. Database write failed
3. Stats field not initialized

**Check:**
- Database connection in logs
- Any database errors
- Stats field exists in Bot model

## Debug Commands

**Check bot status:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV" | jq '.status'
```

**Should return:** `"running"`

**Check trade history:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/trades \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Should return:** Array of trades if executing

## Report Back

Please provide:
1. ✅/❌ Do you see "STARTING BOT RUNNER SERVICE" in logs?
2. ✅/❌ Do you see "Volume bot ... starting main loop"?
3. ✅/❌ Do you see trade execution messages?
4. What are the bot stats? (`volume_today`, `trades_today`)
5. Does bot have wallets configured?
6. Any error messages in logs?
7. What does the bot config look like?
