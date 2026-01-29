# Verify Bot Runner is Executing Trades

## Step 1: Check Railway Logs

**Go to:** Railway Dashboard → trading-bridge service → Logs tab

### Look for Bot Runner Startup (should appear on service start):
```
STARTING BOT RUNNER SERVICE
Found X bot(s) with status='running'
✅ BOT RUNNER SERVICE STARTED
Monitoring X bot(s)
```

### Look for Bot Loop Starting:
```
Volume bot 726186c7-0f5e-44a2-8c7e-b2e01186c0e4 starting main loop...
```

### Look for Trade Execution (should appear within 1-2 minutes):
```
📊 Volume bot 726186c7... - Checking daily target...
  Target: $10,000.00, Today: $0.00
  Found 1 wallet(s)
  Using wallet: {address}...
  ✅ Private key decrypted
  Trade size: $XXX.XX
  Side: buy
  🔄 Executing buy trade...
  Getting quote...
  Quote: XXX → XXX
  Signing and sending transaction...
  ✅ Trade successful! Signature: {signature}...
  📊 Updated stats: $XXX.XX today
```

## Step 2: Check Bot Stats

**Run this command:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/stats \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Expected response if trades are executing:**
```json
{
  "stats": {
    "volume_today": 150.50,
    "trades_today": 1,
    "last_trade_at": "2026-01-29T12:34:56"
  }
}
```

**If empty/null:**
- Bot runner might not be running
- Trades might not be executing
- Check logs for errors

## Step 3: Check Bot Details

**Get full bot info:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Verify:**
- `status: "running"` ✅
- `bot_type: "volume"` ✅
- `config` has required fields:
  - `base_mint`
  - `quote_mint`
  - `daily_volume_usd`
  - `min_trade_usd`
  - `max_trade_usd`
- Bot has wallets configured

## Step 4: Check Trade History

**Get recent trades:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/trades \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Should return array of trades if executing:**
```json
{
  "trades": [
    {
      "id": "...",
      "side": "buy",
      "amount": "...",
      "value_usd": "150.50",
      "tx_signature": "...",
      "status": "success",
      "created_at": "..."
    }
  ]
}
```

## Common Issues

### Issue: No "STARTING BOT RUNNER SERVICE" in logs
**Possible causes:**
- Service didn't restart after deployment
- Bot runner import failed
- Error during startup

**Fix:**
1. Restart Railway service manually
2. Check logs for import errors
3. Verify `bot_runner.py` exists and is correct

### Issue: "Volume bot starting main loop..." but no trades
**Possible causes:**
- No wallets configured for bot
- Daily target already reached
- Jupiter API errors
- Insufficient balance
- Private key decryption failed

**Check logs for:**
- "No wallets configured"
- "Daily target reached"
- "Failed to get quote"
- "Failed to decrypt private key"
- "Insufficient balance"

### Issue: Bot stats empty/null
**Possible causes:**
- Bot runner not updating stats
- Database write failed
- Stats field not initialized

**Fix:**
- Check database connection
- Verify stats field exists in Bot model
- Check for database errors in logs

## Debug Commands

**Check if bot runner module loads:**
```bash
# In Railway logs, look for any import errors
# Should see: "BotRunner initialized"
```

**Check bot configuration:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV" | jq '.config'
```

**Check bot wallets:**
```bash
# Should return wallets if configured
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/wallets \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

## Report Back

Please report:
1. ✅/❌ Do you see "STARTING BOT RUNNER SERVICE"?
2. ✅/❌ Do you see "Volume bot ... starting main loop"?
3. ✅/❌ Do you see trade execution messages?
4. What are the bot stats values? (volume_today, trades_today)
5. Any error messages in logs?
6. Does bot have wallets configured?
