# Phase 1 Test Instructions

## Deployment Status

✅ **Code pushed to GitHub** - Railway should auto-deploy

**Commits:**
- `8ebffe2` - Phase 1: Add Solana bot database schema
- `d0b1d08` - Restore solana_router

## Testing Steps

### 1. Check Railway Deployment (2 min)

**Railway Dashboard:**
1. Go to trading-bridge service
2. Check "Deployments" tab
3. Verify latest deployment succeeded (should show commit `d0b1d08`)
4. Check "Logs" tab for any errors

**Expected logs:**
```
✅ DATABASE INITIALIZATION SUCCESSFUL
✅ All tables created: clients, wallets, connectors, bots, bot_wallets, bot_trades
```

### 2. Verify Database Schema (3 min)

**Option A: Railway PostgreSQL Dashboard**
1. Go to PostgreSQL service → Data tab
2. Run SQL query:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bots', 'bot_wallets', 'bot_trades');

-- Check bot columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bots' 
AND column_name IN ('bot_type', 'stats', 'instance_name', 'connector', 'pair', 'strategy');
```

**Option B: Run Test Script (if you have local access)**
```bash
cd ~/trading-bridge
export DATABASE_URL="your_railway_db_url"
python test_phase1_schema.py
```

### 3. Check for Errors

**Common issues:**
- ❌ Migration failed → Check Railway logs for SQL errors
- ❌ Tables not created → Check init_db() logs
- ⚠️ Columns not nullable → Check ALTER TABLE statements in logs

## Success Criteria

✅ All 6 tables exist: `clients`, `wallets`, `connectors`, `bots`, `bot_wallets`, `bot_trades`
✅ `bots.bot_type` column exists
✅ `bots.stats` column exists
✅ `bots.instance_name`, `connector`, `pair`, `strategy` are nullable
✅ No errors in Railway logs

## If Issues Found

1. Check Railway logs for specific error messages
2. Verify DATABASE_URL is set correctly
3. Check if database connection is working: `/health` endpoint
4. If tables missing, may need to manually run migrations or restart service

## Next Steps (After Phase 1 Verified)

Once Phase 1 is clean → Proceed to **Phase 2: API Endpoints**

Phase 2 will add:
- `POST /bots` - Create Solana bot
- `GET /bots` - List bots (filter by bot_type)
- `GET /bots/{id}` - Get bot details
- `PUT /bots/{id}` - Update bot config
- `POST /bots/{id}/start` - Start bot
- `POST /bots/{id}/stop` - Stop bot
- `GET /bots/{id}/stats` - Get bot statistics
