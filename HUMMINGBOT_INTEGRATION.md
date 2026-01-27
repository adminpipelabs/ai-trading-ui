# Hummingbot API Integration Guide

## Overview

**Goal:** Connect Trading Bridge (Railway) to Hummingbot API (local) so admins can create/start/stop trading bots via the UI.

**Current Flow:**
```
Admin UI → Trading Bridge (Railway) → Hummingbot API (Local) → Executes trades
```

---

## Architecture Decision

### Option 1: Direct Connection (Current Setup)
**Trading Bridge (Railway) → Hummingbot API (Local)**

**Pros:**
- Simple setup
- No additional infrastructure
- Direct control

**Cons:**
- Requires VPN/tunnel for Railway to reach local Hummingbot
- Network complexity
- Not scalable

**When to use:** Development/testing, single instance

---

### Option 2: Cloud Deployment (Recommended)
**Trading Bridge (Railway) → Hummingbot API (Railway/Cloud)**

**Pros:**
- No network tunneling needed
- Scalable
- Production-ready
- Better reliability

**Cons:**
- Requires deploying Hummingbot to cloud
- Additional infrastructure cost

**When to use:** Production, multiple instances

---

### Option 3: Message Queue (Advanced)
**Trading Bridge → RabbitMQ/Kafka → Hummingbot**

**Pros:**
- Decoupled architecture
- Better fault tolerance
- Can handle multiple Hummingbot instances

**Cons:**
- More complex
- Additional infrastructure

**When to use:** Enterprise, high-volume trading

---

## Finding Hummingbot Credentials

### Step 1: Check Docker Compose

```bash
# Navigate to Hummingbot directory
cd ~/hummingbot_files

# Check docker-compose.yml
cat docker-compose.yml | grep -A 10 "hummingbot-api"
```

Look for:
- `HUMMINGBOT_API_USERNAME`
- `HUMMINGBOT_API_PASSWORD`
- `HUMMINGBOT_API_KEY`

### Step 2: Check Environment Files

```bash
# Check .env file
cat .env | grep -i "api\|auth\|user\|pass"

# Or check inside container
docker exec hummingbot-api env | grep -i "api\|auth\|user\|pass"
```

### Step 3: Check Default Credentials

Hummingbot API often uses:
- **Username:** `hummingbot` or `admin`
- **Password:** Check docker-compose or `.env`
- **API Key:** May be in `/app/.env` inside container

### Step 4: Test Authentication

```bash
# Try basic auth
curl -u username:password http://localhost:8000/bot-orchestration/status

# Or with API key
curl -H "X-API-KEY: your-api-key" http://localhost:8000/bot-orchestration/status
```

---

## Trading Bridge Integration

### Step 1: Add Hummingbot Client to Trading Bridge

**File:** `trading-bridge/app/hummingbot_client.py`

```python
import httpx
import os
from typing import Optional, Dict, Any

class HummingbotClient:
    def __init__(self):
        self.base_url = os.getenv("HUMMINGBOT_API_URL", "http://localhost:8000")
        self.username = os.getenv("HUMMINGBOT_API_USERNAME", "hummingbot")
        self.password = os.getenv("HUMMINGBOT_API_PASSWORD", "")
        self.api_key = os.getenv("HUMMINGBOT_API_KEY", "")
        
        # Use API key if available, otherwise basic auth
        if self.api_key:
            self.headers = {"X-API-KEY": self.api_key}
        else:
            self.auth = (self.username, self.password)
            self.headers = {}
    
    async def _request(self, method: str, endpoint: str, **kwargs):
        """Make authenticated request to Hummingbot API"""
        url = f"{self.base_url}{endpoint}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            if self.api_key:
                kwargs.setdefault("headers", {}).update(self.headers)
            else:
                kwargs["auth"] = self.auth
            
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of all running bots"""
        return await self._request("GET", "/bot-orchestration/status")
    
    async def get_bot_runs(self) -> Dict[str, Any]:
        """Get all bot runs"""
        return await self._request("GET", "/bot-orchestration/bot-runs")
    
    async def start_bot(self, bot_name: str, script_file: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Start a bot"""
        return await self._request(
            "POST",
            "/bot-orchestration/start-bot",
            json={
                "bot_name": bot_name,
                "script_file": script_file,
                "config": config
            }
        )
    
    async def deploy_script(self, script_content: str, script_name: str) -> Dict[str, Any]:
        """Deploy a v2 strategy script"""
        return await self._request(
            "POST",
            "/bot-orchestration/deploy-v2-script",
            json={
                "script_content": script_content,
                "script_name": script_name
            }
        )
    
    async def stop_bot(self, bot_name: str) -> Dict[str, Any]:
        """Stop a running bot"""
        return await self._request(
            "POST",
            f"/bot-orchestration/{bot_name}/stop"
        )
    
    async def get_bot_history(self, bot_name: str) -> Dict[str, Any]:
        """Get bot trade history"""
        return await self._request(
            "GET",
            f"/bot-orchestration/{bot_name}/history"
        )
```

---

### Step 2: Update Bot Routes

**File:** `trading-bridge/app/bot_routes.py`

```python
from fastapi import APIRouter, HTTPException
from app.hummingbot_client import HummingbotClient
from app.bots import BotManager

router = APIRouter()
hummingbot_client = HummingbotClient()

@router.get("/bots")
async def get_bots():
    """Get all bots from Hummingbot"""
    try:
        status = await hummingbot_client.get_status()
        bot_runs = await hummingbot_client.get_bot_runs()
        
        # Transform Hummingbot format to our format
        bots = []
        for bot_name, bot_info in status.get("bots", {}).items():
            bots.append({
                "id": bot_name,
                "name": bot_name,
                "status": "running" if bot_info.get("is_running") else "stopped",
                "strategy": bot_info.get("strategy", "unknown"),
                "connector": bot_info.get("connector", "unknown"),
                "pair": bot_info.get("trading_pair", "unknown"),
                "chain": "solana" if "jupiter" in bot_info.get("connector", "").lower() else "evm"
            })
        
        return {"bots": bots}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bots/create")
async def create_bot(bot_data: dict):
    """Create and start a bot via Hummingbot"""
    try:
        bot_name = bot_data.get("name")
        strategy = bot_data.get("strategy")  # "spread" or "volume"
        connector = bot_data.get("connector")  # "bitmart", "jupiter", etc.
        pair = bot_data.get("pair")  # "SHARP/USDT"
        config = bot_data.get("config", {})
        
        # Generate Hummingbot script based on strategy
        script_content = generate_hummingbot_script(strategy, connector, pair, config)
        script_name = f"{bot_name}_strategy.py"
        
        # Deploy script
        await hummingbot_client.deploy_script(script_content, script_name)
        
        # Start bot
        result = await hummingbot_client.start_bot(
            bot_name=bot_name,
            script_file=script_name,
            config=config
        )
        
        return {"success": True, "bot_id": bot_name, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bots/{bot_id}/start")
async def start_bot(bot_id: str):
    """Start a bot"""
    try:
        # Get bot config from database/cache
        # Then call Hummingbot API
        result = await hummingbot_client.start_bot(bot_id, ...)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bots/{bot_id}/stop")
async def stop_bot(bot_id: str):
    """Stop a bot"""
    try:
        result = await hummingbot_client.stop_bot(bot_id)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_hummingbot_script(strategy: str, connector: str, pair: str, config: dict) -> str:
    """Generate Hummingbot v2 script"""
    if strategy == "spread":
        return f"""
from hummingbot.strategy.pure_market_making.pure_market_making_v2 import PureMarketMakingStrategyV2

strategy = PureMarketMakingStrategyV2(
    exchange="{connector}",
    trading_pair="{pair}",
    bid_spread={config.get("bid_spread", 0.001)},
    ask_spread={config.get("ask_spread", 0.001)},
    order_amount={config.get("order_amount", 100)},
    order_refresh_time={config.get("order_refresh_time", 60)}
)
"""
    elif strategy == "volume":
        return f"""
# Volume generator strategy
# Custom implementation based on requirements
"""
    else:
        raise ValueError(f"Unknown strategy: {strategy}")
```

---

### Step 3: Environment Variables

**File:** `trading-bridge/.env` (or Railway environment variables)

```bash
# Hummingbot API Configuration
HUMMINGBOT_API_URL=http://localhost:8000  # Or cloud URL
HUMMINGBOT_API_USERNAME=hummingbot
HUMMINGBOT_API_PASSWORD=your_password
HUMMINGBOT_API_KEY=your_api_key  # Optional, if using API key auth
```

**For Railway deployment:**
- If Hummingbot is local: Use ngrok/tailscale tunnel
- If Hummingbot is cloud: Use cloud URL directly

---

## Network Setup Options

### Option A: ngrok Tunnel (Quick Testing)

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Create tunnel
ngrok http 8000

# Use the ngrok URL in Trading Bridge
HUMMINGBOT_API_URL=https://abc123.ngrok.io
```

### Option B: Tailscale (Secure VPN)

```bash
# Install Tailscale on both machines
# Add both to same Tailscale network
# Use Tailscale IP

HUMMINGBOT_API_URL=http://100.x.x.x:8000
```

### Option C: Cloud Deployment (Production)

Deploy Hummingbot to Railway/CloudRun/AWS and use cloud URL.

---

## Testing Checklist

- [ ] Find Hummingbot API credentials
- [ ] Test authentication with curl
- [ ] Add HummingbotClient to Trading Bridge
- [ ] Update bot routes to use HummingbotClient
- [ ] Set environment variables
- [ ] Test `/bots` endpoint (should return Hummingbot bots)
- [ ] Test `/bots/create` endpoint
- [ ] Test `/bots/{id}/start` endpoint
- [ ] Test `/bots/{id}/stop` endpoint
- [ ] Verify bots appear in UI

---

## Troubleshooting

### "Not authenticated" Error
- Check credentials in `.env`
- Verify auth method (basic auth vs API key)
- Test with curl first

### Connection Refused
- Hummingbot API not running: `docker-compose up -d hummingbot-api`
- Wrong port: Check `docker-compose.yml` for port mapping
- Network issue: Use tunnel or deploy to cloud

### Bot Not Starting
- Check Hummingbot logs: `docker logs hummingbot-api`
- Verify script format matches Hummingbot v2
- Check connector/exchange credentials in Hummingbot

---

## Next Steps

1. **Find credentials** - Check docker-compose.yml and .env files
2. **Choose architecture** - Local with tunnel vs Cloud deployment
3. **Implement HummingbotClient** - Add to Trading Bridge
4. **Update bot routes** - Connect to Hummingbot API
5. **Test integration** - Verify end-to-end flow
6. **Deploy** - Push to Railway

---

## Questions for CTO

1. **Where are Hummingbot API credentials stored?**
   - Check: `~/hummingbot_files/docker-compose.yml`
   - Check: `~/hummingbot_files/.env`
   - Check: Inside container: `docker exec hummingbot-api env`

2. **Is Hummingbot API local-only or cloud-deployed?**
   - If local: Need tunnel (ngrok/tailscale) or deploy to cloud
   - If cloud: Use cloud URL directly

3. **Preferred architecture?**
   - Option 1: Local + Tunnel (quick, for testing)
   - Option 2: Cloud deployment (production-ready)
   - Option 3: Message queue (enterprise)

4. **Which Hummingbot endpoints are needed?**
   - Start/stop bots: ✅ Required
   - Deploy scripts: ✅ Required
   - Trade history: ⚠️ Optional
   - Performance metrics: ⚠️ Optional
