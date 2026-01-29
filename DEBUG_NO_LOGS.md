# Debug: No Bot Runner Logs

## Issue
Railway deploy log shows:
```
Starting Container
INFO  Accepting connections at http://localhost:3000
```

**But no bot runner logs appear.**

## Analysis

### Port 3000 = Frontend?
Port 3000 is typically the frontend port. The backend (trading-bridge) should run on port 8000 or similar.

**Question:** Is this the trading-bridge backend service or the frontend service?

### Possible Issues

1. **Wrong Service** - This might be the frontend service, not backend
2. **Logs Not Streaming** - Logs might be there but not shown in Railway UI
3. **Lifespan Not Running** - FastAPI lifespan might not be executing
4. **Logging Level** - Logs might be at DEBUG level, not INFO

## What to Check

### 1. Verify Service
**Is this the trading-bridge backend or frontend?**
- Backend should run on port 8000 (or PORT env var)
- Frontend runs on port 3000

### 2. Check All Logs
In Railway:
- Go to trading-bridge service
- Check "Deploy Logs" tab
- Check "HTTP Logs" tab  
- Check "Network Flow Logs" tab
- Look for ANY logs mentioning "bot runner" or "database"

### 3. Check Service Health
```bash
curl https://trading-bridge-production.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "Trading Bridge",
  "database": "postgresql"
}
```

### 4. Check Database Init Logs
Look for:
- "STARTING DATABASE INITIALIZATION"
- "✅ DATABASE INITIALIZATION COMPLETE"

If these don't appear, the lifespan function isn't running.

## Expected Logs

If bot runner is working, you should see:
```
STARTING DATABASE INITIALIZATION
✅ DATABASE INITIALIZATION COMPLETE
ATTEMPTING TO START BOT RUNNER
✅ Bot runner module imported successfully
STARTING BOT RUNNER SERVICE
Found X bot(s) with status='running'
✅ BOT RUNNER SERVICE STARTED
```

## Next Steps

1. **Confirm which service** - Is this trading-bridge backend?
2. **Check all log tabs** in Railway (not just Deploy Logs)
3. **Check /health endpoint** - Verify service is running
4. **Check database init logs** - Verify lifespan is running
5. **Manually restart** the service to trigger fresh logs

## If Still No Logs

Try adding a simple test log at the very top of main.py:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("=" * 80)
logger.info("MAIN.PY LOADED")
logger.info("=" * 80)
```

This will confirm if main.py is even being executed.
