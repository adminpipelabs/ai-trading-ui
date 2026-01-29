# Verify Bot Runner Deployment

## ✅ Step 1: Check Railway Logs

Go to Railway Dashboard → trading-bridge service → Logs

**Look for these success messages:**
```
STARTING BOT RUNNER SERVICE
Found X bot(s) with status='running'
✅ BOT RUNNER SERVICE STARTED
Monitoring X bot(s)
Volume bot {bot_id} starting main loop...
```

**If you see errors:**
- `Bot runner error: ...` - Check the error message
- `No wallets configured` - Bot needs wallets added
- `Failed to decrypt private key` - ENCRYPTION_KEY issue
- `Database not available` - DATABASE_URL issue

## ✅ Step 2: Check Bot Status

**List all bots:**
```bash
curl https://trading-bridge-production.up.railway.app/bots \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Check specific bot (726186c7-0f5e-44a2-8c7e-b2e01186c0e4):**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Expected response:**
```json
{
  "id": "726186c7-0f5e-44a2-8c7e-b2e01186c0e4",
  "name": "Lynk",
  "status": "running",
  "bot_type": "volume",
  "stats": {
    "volume_today": 0,
    "trades_today": 0
  }
}
```

## ✅ Step 3: Watch for Trade Execution

**In Railway logs, look for:**
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

## ✅ Step 4: Check Bot Stats Update

After a few minutes, check bot stats again:
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Stats should show:**
- `volume_today` > 0 (if trades executed)
- `trades_today` > 0
- `last_trade_at` timestamp

## ✅ Step 5: Check Trade History

**Get recent trades:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/trades \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Expected response:**
```json
{
  "trades": [
    {
      "id": "...",
      "side": "buy",
      "amount": "...",
      "value_usd": "...",
      "tx_signature": "...",
      "status": "success",
      "created_at": "..."
    }
  ]
}
```

## 🐛 Troubleshooting

### Bot not executing trades?

1. **Check bot status:**
   - Status must be "running"
   - If "stopped", start it: `POST /bots/{id}/start`

2. **Check bot has wallets:**
   - Bot needs at least one wallet configured
   - Check: `GET /bots/{id}` - should show wallets

3. **Check ENCRYPTION_KEY:**
   - Must be set in Railway environment variables
   - Should be a Fernet key (32 bytes base64)

4. **Check daily target:**
   - If `volume_today >= daily_volume_usd`, bot sleeps until midnight
   - Check config: `daily_volume_usd` value

### No logs appearing?

1. **Check service is running:**
   - Railway Dashboard → trading-bridge → Status should be "Active"

2. **Check logs are enabled:**
   - Railway Dashboard → trading-bridge → Logs tab

3. **Restart service:**
   - Railway Dashboard → trading-bridge → Restart

### Database errors?

1. **Check DATABASE_URL:**
   - Must be set in Railway
   - Should be PostgreSQL connection string

2. **Check tables exist:**
   - Logs should show: `✅ DATABASE INITIALIZATION SUCCESSFUL`
   - Tables: `bots`, `bot_wallets`, `bot_trades`

## 📊 Expected Timeline

- **0-30 seconds:** Bot runner starts, loads bots
- **30-60 seconds:** First trade execution attempt
- **Every 15-45 minutes:** New trade (random interval)

## ✅ Success Criteria

Bot runner is working if you see:
1. ✅ "STARTING BOT RUNNER SERVICE" in logs
2. ✅ "Volume bot {id} starting main loop..." in logs
3. ✅ Trade execution messages in logs
4. ✅ Bot stats updating (`volume_today` increasing)
5. ✅ Trade history showing successful trades
