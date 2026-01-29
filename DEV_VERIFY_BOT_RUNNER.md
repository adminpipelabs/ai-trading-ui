# Dev: Verify Bot Runner Deployment

## Status
✅ Bot runner code deployed
✅ Database models updated
⏳ **Need verification that it's working**

## What to Check

### 1. Railway Logs (Most Important)

**Go to:** Railway Dashboard → trading-bridge service → Logs tab

**Look for these messages (should appear within 30 seconds of deployment):**
```
STARTING BOT RUNNER SERVICE
Found X bot(s) with status='running'
✅ BOT RUNNER SERVICE STARTED
Monitoring X bot(s)
Volume bot {bot_id} starting main loop...
```

**If you see errors, note them:**
- `Bot runner error: ...` - What's the error?
- `No wallets configured` - Bot needs wallets
- `Failed to decrypt private key` - ENCRYPTION_KEY issue
- `Database not available` - DATABASE_URL issue

### 2. Bot Execution Logs

**Within 1-2 minutes, you should see:**
```
📊 Volume bot 726186c7... - Checking daily target...
  Target: $10,000.00, Today: $0.00
  Found 1 wallet(s)
  Using wallet: {address}...
  ✅ Private key decrypted
  Trade size: $XXX.XX
  Side: buy
  🔄 Executing buy trade...
```

**If trades execute successfully:**
```
  ✅ Trade successful! Signature: {signature}...
  📊 Updated stats: $XXX.XX today
```

### 3. Test Bot Status

**Check if bot is running:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4 \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Expected:**
- `status: "running"`
- `bot_type: "volume"`
- `stats` object present

### 4. Check Trade History

**After 5-10 minutes, check if trades are being recorded:**
```bash
curl https://trading-bridge-production.up.railway.app/bots/726186c7-0f5e-44a2-8c7e-b2e01186c0e4/trades \
  -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
```

**Should return:**
- Array of trades (if any executed)
- Each trade has `tx_signature`, `status`, `side`, etc.

## Questions for Dev

1. **Do you see "STARTING BOT RUNNER SERVICE" in logs?**
   - Yes / No
   - If No → Service might not have restarted

2. **Do you see "Volume bot {id} starting main loop..."?**
   - Yes / No
   - If No → Bot might not be in "running" status

3. **Do you see trade execution attempts?**
   - Yes / No
   - If No → Check for errors in logs

4. **Any errors in logs?**
   - List any error messages you see

5. **Is the bot status "running" when you check via API?**
   - Yes / No

6. **Are stats updating?**
   - Check `volume_today` and `trades_today` values
   - Are they increasing?

## Common Issues & Fixes

### Issue: No "STARTING BOT RUNNER SERVICE" message
**Fix:** Restart the Railway service manually

### Issue: "No wallets configured"
**Fix:** Bot needs wallets added via `/bots/{id}/wallets` endpoint

### Issue: "Failed to decrypt private key"
**Fix:** Check ENCRYPTION_KEY is set in Railway environment variables

### Issue: Bot status is "stopped"
**Fix:** Start the bot: `POST /bots/{id}/start`

### Issue: No trade execution logs
**Possible causes:**
- Daily target already reached (check `stats.volume_today`)
- No wallets configured
- Jupiter API errors
- Insufficient balance in wallet

## Expected Timeline

- **0-30 seconds:** Bot runner starts
- **30-60 seconds:** First trade attempt
- **Every 15-45 minutes:** New trades (random interval)

## Report Back

Please report:
1. ✅/❌ Bot runner started (logs show startup message)
2. ✅/❌ Bot loop running (logs show "starting main loop")
3. ✅/❌ Trades executing (logs show trade attempts)
4. Any error messages
5. Bot stats values (`volume_today`, `trades_today`)
