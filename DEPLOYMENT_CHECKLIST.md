# Bot Runner Deployment Checklist

## ✅ Completed
- [x] Created `bot_runner.py` with volume bot execution loop
- [x] Created `wallet_encryption.py` for secure key storage
- [x] Updated `database.py` with all required models:
  - [x] Added `bot_type` field to Bot model
  - [x] Added `stats` field to Bot model
  - [x] Created `BotWallet` model
  - [x] Created `BotTrade` model
  - [x] Updated `Bot.to_dict()` to include bot_type and stats

## 🚀 Deployment Steps

1. **Commit and push changes:**
   ```bash
   cd trading-bridge
   git add app/bot_runner.py app/wallet_encryption.py app/database.py
   git commit -m "Add bot runner service and update database models"
   git push
   ```

2. **Deploy to Railway:**
   - Railway should auto-deploy on push
   - Or manually trigger deployment

3. **Restart service:**
   - Railway Dashboard → trading-bridge service → Restart

4. **Check logs for:**
   ```
   STARTING BOT RUNNER SERVICE
   Found X bot(s) with status='running'
   Volume bot {id} starting main loop...
   ```

## 🔍 Verification

After deployment, check Railway logs for:

### ✅ Success Indicators:
- `STARTING BOT RUNNER SERVICE`
- `✅ BOT RUNNER SERVICE STARTED`
- `Volume bot {id} starting main loop...`
- `📊 Volume bot {id} - Checking daily target...`

### ❌ Error Indicators:
- `Bot runner error: ...` - Check error message
- `No wallets configured` - Bot needs wallets added
- `Failed to decrypt private key` - ENCRYPTION_KEY issue
- `Failed to get quote` - Jupiter API issue

## 📝 Environment Variables

Ensure these are set in Railway:
- `ENCRYPTION_KEY` - Fernet key for encrypting private keys
- `SOLANA_RPC_URL` - Solana RPC endpoint (optional, defaults to mainnet)
- `DATABASE_URL` - PostgreSQL connection string

## 🧪 Testing

1. **Check bot status:**
   ```bash
   curl https://trading-bridge-production.up.railway.app/bots
   ```

2. **Start a bot:**
   ```bash
   curl -X POST https://trading-bridge-production.up.railway.app/bots/{bot_id}/start
   ```

3. **Watch logs:**
   - Railway Dashboard → trading-bridge → Logs
   - Look for trade execution messages

## 📊 Expected Behavior

Once deployed, the bot runner will:
1. Start automatically on app startup
2. Load all bots with `status='running'`
3. For each volume bot:
   - Check daily volume target
   - Pick random wallet
   - Execute swaps via Jupiter
   - Record trades in database
   - Update bot stats
   - Sleep for random interval

## 🐛 Troubleshooting

**Bot not executing trades?**
- Check bot status is "running"
- Check bot has wallets configured
- Check ENCRYPTION_KEY is set
- Check logs for errors

**Database errors?**
- Check DATABASE_URL is set correctly
- Check tables exist (should auto-create on startup)
- Check logs for initialization errors

**No logs?**
- Check Railway service is running
- Check logs are enabled
- Restart service
