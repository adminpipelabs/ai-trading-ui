# Dev Help: Bot Runner Not Showing Logs

## CTO Diagnosis Complete

**Code Status:** ✅ All code is correct
- ✅ `bot_runner.py` exists at `app/bot_runner.py`
- ✅ `main.py` has lifespan function that starts bot runner
- ✅ Logging is configured
- ✅ Import paths are correct

**Service Status:** ✅ Backend is running
- ✅ `/health` endpoint works
- ✅ Service responds to requests

**Issue:** ❌ No logs appearing in Railway

## What I've Checked

1. ✅ Verified `bot_runner.py` exists
2. ✅ Verified `main.py` has correct startup code
3. ✅ Verified logging configuration
4. ✅ Added better error logging in `main.py`
5. ✅ Added bot runner status to `/health` endpoint

## What Dev Needs to Do

### 1. Check Bot Runner Status via API

**Run this command:**
```bash
curl https://trading-bridge-production.up.railway.app/health | jq .
```

**Look for `bot_runner` field:**
```json
{
  "status": "healthy",
  "service": "Trading Bridge",
  "database": "postgresql",
  "bot_runner": "running (1 bots)"  // or "started (0 bots)" or "error: ..."
}
```

This will tell us if bot runner is actually running, even without logs.

### 2. Check Railway Service Configuration

**Verify:**
- Service name is "trading-bridge" (backend, not frontend)
- Port is 8080 (or PORT env var)
- Startup command is: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3. Check All Railway Log Tabs

**Not just "Deploy Logs" - check:**
- "Deploy Logs" tab
- "HTTP Logs" tab
- "Network Flow Logs" tab
- Any other log tabs available

### 4. Verify bot_runner.py is Deployed

**Check if file exists in deployed container:**
- Railway might not have deployed the file
- Check deployment logs for any file copy errors
- Or SSH into container and check: `ls -la app/bot_runner.py`

### 5. Check Railway Environment Variables

**Verify these are set:**
- `DATABASE_URL` - Should be set
- `ENCRYPTION_KEY` - Required for wallet encryption
- `PORT` - Railway sets this automatically

### 6. Manual Service Restart

**Try restarting the service:**
- Railway Dashboard → trading-bridge service → Restart
- This will trigger fresh startup logs
- Watch logs immediately after restart

## Expected Logs After Restart

If everything works, you should see:
```
STARTING DATABASE INITIALIZATION
✅ DATABASE INITIALIZATION COMPLETE
ATTEMPTING TO START BOT RUNNER
✅ Bot runner module imported successfully
STARTING BOT RUNNER SERVICE
Found X bot(s) with status='running'
✅ BOT RUNNER SERVICE STARTED
```

## Quick Test

**Check bot runner status:**
```bash
curl https://trading-bridge-production.up.railway.app/health | jq '.bot_runner'
```

**Possible responses:**
- `"running (1 bots)"` - ✅ Bot runner is working!
- `"started (0 bots)"` - Bot runner started but no bots found
- `"error: ..."` - Bot runner failed to start (check error message)

## If Health Endpoint Shows Bot Runner Running

**Then the issue is just logs not appearing:**
- Bot runner is working
- Logs aren't being captured/shown
- Check Railway log settings
- Check if logs are going to a different stream

## If Health Endpoint Shows Error

**Then bot runner isn't starting:**
- Check the error message
- Check Railway logs for import errors
- Verify `bot_runner.py` exists in deployed code
- Check for missing dependencies

## Report Back

Please provide:
1. What does `/health` endpoint show for `bot_runner` field?
2. What's the Railway service startup command?
3. Are you checking all log tabs (not just Deploy Logs)?
4. Does `app/bot_runner.py` exist in the deployed container?
5. Any errors when you restart the service?

## Code Changes Made

1. ✅ Added better error logging in `main.py`
2. ✅ Added bot runner status to `/health` endpoint
3. ✅ Improved error messages with full tracebacks

All code is ready - just need to verify deployment and logs.
