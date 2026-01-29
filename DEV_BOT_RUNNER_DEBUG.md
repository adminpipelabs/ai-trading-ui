# Dev: Bot Runner Debug - No Logs Appearing

## Status
✅ **Backend is running** - `/health` endpoint works
❌ **No logs appearing** - Can't see bot runner startup logs

## Issue
Railway deploy log only shows:
```
Starting Container
INFO  Accepting connections at http://localhost:3000
```

**Missing logs:**
- No "STARTING DATABASE INITIALIZATION"
- No "ATTEMPTING TO START BOT RUNNER"
- No bot runner logs at all

## Possible Causes

1. **Logs not streaming** - Railway might not be showing all logs
2. **Lifespan not running** - FastAPI lifespan might not execute
3. **Logging level** - Logs might be filtered out
4. **bot_runner.py missing** - File might not be deployed

## Quick Checks

### 1. Verify bot_runner.py exists
**In Railway, check if file exists:**
- Go to trading-bridge service
- Check if `app/bot_runner.py` exists in the codebase
- Or check deployment logs for file listing

### 2. Check all log tabs
**In Railway Dashboard:**
- "Deploy Logs" tab - Shows deployment logs
- "HTTP Logs" tab - Shows request logs
- "Network Flow Logs" tab - Shows network activity
- Look in ALL tabs, not just Deploy Logs

### 3. Test if lifespan runs
**Add a simple test:**
The lifespan function should log "STARTING DATABASE INITIALIZATION" - if you don't see this, lifespan isn't running.

### 4. Check Railway service logs
**Try accessing logs via Railway CLI or API:**
- Railway might have separate log streams
- Check if there's a "Logs" tab separate from "Deploy Logs"

## What We Need

1. **Confirm bot_runner.py exists** in the deployed codebase
2. **Check ALL log tabs** in Railway (not just Deploy Logs)
3. **Check if lifespan logs appear** - Look for "DATABASE INITIALIZATION"
4. **Try manual restart** - Restart service to trigger fresh logs

## Expected Logs

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

## If Still No Logs

**Try adding a simple test log at the very top of main.py:**
```python
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logger.info("=" * 80)
logger.info("MAIN.PY LOADED - THIS SHOULD APPEAR IN LOGS")
logger.info("=" * 80)
```

This will confirm if main.py is even being executed and if logs are being captured.

## Next Steps

1. Check if `app/bot_runner.py` exists in deployed code
2. Check ALL Railway log tabs (Deploy, HTTP, Network Flow)
3. Look for "DATABASE INITIALIZATION" logs
4. Try manual service restart
5. Report what you find
