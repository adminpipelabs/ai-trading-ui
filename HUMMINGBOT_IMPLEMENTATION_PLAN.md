# Hummingbot Integration - Implementation Plan

**For Developer Review & Feedback**

---

## 🎯 **What We're Building**

Connect Trading Bridge (Railway) to Hummingbot API so that:
1. Admin can create bots via UI → Trading Bridge → Hummingbot API
2. Admin can start/stop bots via UI
3. Bot status updates in real-time
4. Eventually: MCP can manage bots via chat

---

## 📋 **Current Architecture**

```
Admin UI (React)
    ↓ HTTP
Trading Bridge (FastAPI on Railway)
    ↓ HTTP (needs to be added)
Hummingbot API (Local, port 8000)
```

**Problem:** Trading Bridge has bot endpoints (`/bots`, `/bots/create`, etc.) but they don't connect to Hummingbot yet.

---

## 🔧 **What I'll Implement**

### **Step 1: Add HummingbotClient Class**

**File:** `trading-bridge/app/hummingbot_client.py` (NEW FILE)

**Purpose:** HTTP client to communicate with Hummingbot API

**What it does:**
- Handles authentication (basic auth or API key)
- Makes HTTP requests to Hummingbot endpoints
- Handles errors gracefully
- Returns Python dicts (not raw responses)

**Key Methods:**
```python
- get_status() → Get all running bots
- get_bot_runs() → Get bot history
- start_bot(bot_name, script_file, config) → Start a bot
- stop_bot(bot_name) → Stop a bot
- deploy_script(script_content, script_name) → Deploy strategy script
- get_bot_history(bot_name) → Get trade history
```

**Configuration:**
- Uses environment variables:
  - `HUMMINGBOT_API_URL` (e.g., `http://localhost:8000` or Tailscale IP)
  - `HUMMINGBOT_API_USERNAME`
  - `HUMMINGBOT_API_PASSWORD`

---

### **Step 2: Update Bot Routes**

**File:** `trading-bridge/app/bot_routes.py` (MODIFY EXISTING)

**Current State:**
- Has stub endpoints that return mock data
- Needs to call HummingbotClient instead

**What I'll Change:**

1. **Import HummingbotClient**
   ```python
   from app.hummingbot_client import HummingbotClient
   ```

2. **Initialize client**
   ```python
   hummingbot_client = HummingbotClient()
   ```

3. **Update `/bots` endpoint**
   - Currently: Returns mock data
   - After: Calls `hummingbot_client.get_status()`
   - Transforms Hummingbot format to our format

4. **Update `/bots/create` endpoint**
   - Currently: Stub
   - After: 
     - Generates Hummingbot script based on strategy
     - Calls `hummingbot_client.deploy_script()`
     - Calls `hummingbot_client.start_bot()`
     - Returns success response

5. **Update `/bots/{id}/start` endpoint**
   - Currently: Stub
   - After: Calls `hummingbot_client.start_bot()`

6. **Update `/bots/{id}/stop` endpoint**
   - Currently: Stub
   - After: Calls `hummingbot_client.stop_bot()`

---

### **Step 3: Add Script Generation**

**File:** `trading-bridge/app/bot_routes.py` (NEW FUNCTION)

**Purpose:** Generate Hummingbot v2 strategy scripts

**What it does:**
- Takes strategy type (spread/volume), connector, pair, config
- Generates Python script for Hummingbot
- Returns script as string

**Example Output:**
```python
from hummingbot.strategy.pure_market_making.pure_market_making_v2 import PureMarketMakingStrategyV2

strategy = PureMarketMakingStrategyV2(
    exchange="bitmart",
    trading_pair="SHARP/USDT",
    bid_spread=0.001,
    ask_spread=0.001,
    order_amount=100,
    order_refresh_time=60
)
```

---

### **Step 4: Update Main App**

**File:** `trading-bridge/app/main.py` (VERIFY)

**Purpose:** Ensure bot routes are included

**What I'll Check:**
- `bot_router` is imported
- `app.include_router(bot_router)` is called

**Expected:** Already done, but will verify

---

## 📁 **Files That Will Change**

### **New Files:**
1. `trading-bridge/app/hummingbot_client.py` - HTTP client for Hummingbot API

### **Modified Files:**
1. `trading-bridge/app/bot_routes.py` - Update endpoints to use HummingbotClient
2. `trading-bridge/.env` (or Railway env vars) - Add Hummingbot credentials

### **No Changes:**
- Frontend code (already calls Trading Bridge endpoints)
- Other Trading Bridge files
- Hummingbot itself

---

## 🔐 **Environment Variables Needed**

**In Railway (Trading Bridge service):**

```bash
# Hummingbot API Configuration
HUMMINGBOT_API_URL=http://localhost:8000  # Or Tailscale IP
HUMMINGBOT_API_USERNAME=hummingbot
HUMMINGBOT_API_PASSWORD=<password_from_creds_script>
```

**Note:** These will be set manually in Railway dashboard (not in code)

---

## 🧪 **Testing Plan**

### **Step 1: Test HummingbotClient Directly**
```python
# Test script
from app.hummingbot_client import HummingbotClient

client = HummingbotClient()
status = await client.get_status()
print(status)
```

### **Step 2: Test Trading Bridge Endpoints**
```bash
# Get bots
curl https://trading-bridge-production.up.railway.app/bots

# Create bot
curl -X POST https://trading-bridge-production.up.railway.app/bots/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_bot",
    "strategy": "spread",
    "connector": "bitmart",
    "pair": "SHARP/USDT",
    "config": {}
  }'
```

### **Step 3: Test via UI**
- Navigate to Bot Management page
- Click "Create Bot"
- Verify bot appears in list
- Test start/stop buttons

---

## ⚠️ **Potential Issues & Solutions**

### **Issue 1: Network Connectivity**
**Problem:** Railway can't reach local Hummingbot  
**Solution:** Use Tailscale VPN (Phase 1) or deploy Hummingbot to Railway (Phase 2)

### **Issue 2: Authentication**
**Problem:** Hummingbot API rejects requests  
**Solution:** Verify credentials with `find_hummingbot_creds.sh`

### **Issue 3: Script Format**
**Problem:** Generated script doesn't work  
**Solution:** Test with simple script first, iterate on format

### **Issue 4: Error Handling**
**Problem:** Errors not handled gracefully  
**Solution:** Add try/catch, return proper HTTP errors

---

## 📊 **Data Flow Example**

### **Create Bot Flow:**

```
1. User clicks "Create Bot" in UI
   ↓
2. Frontend calls: POST /bots/create
   {
     "name": "sharp_spread",
     "strategy": "spread",
     "connector": "bitmart",
     "pair": "SHARP/USDT"
   }
   ↓
3. Trading Bridge bot_routes.py receives request
   ↓
4. Generates Hummingbot script:
   - strategy = PureMarketMakingStrategyV2(...)
   ↓
5. Calls hummingbot_client.deploy_script(script, "sharp_spread.py")
   ↓
6. Calls hummingbot_client.start_bot("sharp_spread", "sharp_spread.py", config)
   ↓
7. Hummingbot API starts bot
   ↓
8. Returns success to frontend
   ↓
9. UI refreshes bot list
```

---

## 🔍 **Code Structure**

### **HummingbotClient Class:**

```python
class HummingbotClient:
    def __init__(self):
        # Read env vars
        # Set up auth
        
    async def _request(self, method, endpoint, **kwargs):
        # Make HTTP request with auth
        # Handle errors
        # Return JSON
        
    async def get_status(self):
        # GET /bot-orchestration/status
        
    async def start_bot(self, bot_name, script_file, config):
        # POST /bot-orchestration/start-bot
        
    # ... other methods
```

### **Bot Routes:**

```python
@router.get("/bots")
async def get_bots():
    # Call hummingbot_client.get_status()
    # Transform format
    # Return bots list

@router.post("/bots/create")
async def create_bot(bot_data: dict):
    # Generate script
    # Deploy script
    # Start bot
    # Return success
```

---

## ✅ **What Success Looks Like**

1. ✅ Trading Bridge can connect to Hummingbot API
2. ✅ `/bots` endpoint returns real bots from Hummingbot
3. ✅ `/bots/create` creates and starts bots in Hummingbot
4. ✅ `/bots/{id}/start` starts bots
5. ✅ `/bots/{id}/stop` stops bots
6. ✅ UI shows real bot status
7. ✅ Errors are handled gracefully

---

## 🚀 **Implementation Steps**

1. **Create HummingbotClient** (`hummingbot_client.py`)
   - HTTP client with auth
   - Methods for all endpoints
   - Error handling

2. **Update bot_routes.py**
   - Import HummingbotClient
   - Update each endpoint
   - Add script generation

3. **Add environment variables**
   - Document required vars
   - Set in Railway

4. **Test locally**
   - Test HummingbotClient
   - Test endpoints
   - Test via UI

5. **Deploy to Railway**
   - Push code
   - Set env vars
   - Verify deployment

---

## 💬 **Questions for Developer**

1. **Script Generation:**
   - Do you have existing Hummingbot script templates?
   - What's the exact format for v2 scripts?
   - Any specific config parameters needed?

2. **Error Handling:**
   - How should we handle Hummingbot API errors?
   - Should we retry on failures?
   - What error format should we return?

3. **Bot Naming:**
   - Any naming conventions for bots?
   - Should names be unique?
   - How to handle conflicts?

4. **Configuration:**
   - What config parameters are required?
   - Any defaults we should use?
   - How to validate config?

5. **Testing:**
   - Do you have a test Hummingbot instance?
   - Should I test locally first?
   - Any specific test cases?

---

## 📝 **Review Checklist**

Before I start, please confirm:

- [ ] Hummingbot API is running and accessible
- [ ] Credentials are available (or I can run `find_hummingbot_creds.sh`)
- [ ] Network connectivity is set up (Tailscale or Railway)
- [ ] You've reviewed the implementation plan
- [ ] You have feedback/questions

---

## 🎯 **Next Steps**

1. **You review this plan** → Provide feedback
2. **I implement** → Create/modify files
3. **You review code** → Check implementation
4. **We test together** → Verify it works
5. **Deploy** → Push to Railway

---

**Ready for your feedback!** 🚀
