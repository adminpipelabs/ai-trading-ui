# Hummingbot Integration + MCP Architecture - Recommendation

## Executive Summary

**Recommended Architecture:** **Hybrid Approach**
- **Phase 1 (Now):** Local Hummingbot + Tailscale VPN tunnel
- **Phase 2 (Production):** Deploy Hummingbot to Railway alongside Trading Bridge
- **MCP Integration:** Expose bot management tools via MCP so Claude can manage bots through chat

---

## Architecture Recommendation

### ✅ **Recommended: Hybrid Cloud Deployment**

**Why this approach:**
1. **Trading Bridge is already on Railway** → Deploy Hummingbot there too
2. **No network tunneling complexity** → Same cloud, same network
3. **Scalable** → Can add more Hummingbot instances
4. **MCP-friendly** → All services accessible from Pipe Labs backend

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    Railway Cloud                        │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐               │
│  │ Trading      │──────▶│ Hummingbot   │               │
│  │ Bridge       │ HTTP │ API          │               │
│  │ (FastAPI)    │◀─────│ (Port 8000)  │               │
│  └──────────────┘      └──────────────┘               │
│         │                      │                        │
│         │                      │                        │
│         ▼                      ▼                        │
│  ┌──────────────┐      ┌──────────────┐               │
│  │ Pipe Labs    │      │ Hummingbot   │               │
│  │ Backend      │      │ Postgres     │               │
│  │ (MCP Server) │      │ (Port 5432)  │               │
│  └──────────────┘      └──────────────┘               │
│         │                                               │
│         │ MCP Tools                                    │
│         ▼                                               │
│  ┌──────────────┐                                       │
│  │ Admin UI     │                                       │
│  │ (React)      │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ No VPN/tunnel needed
- ✅ Low latency (same datacenter)
- ✅ Easy to scale
- ✅ MCP can access both services directly

---

## MCP Integration Architecture

### Current MCP Flow

```
User Chat → Admin UI → Pipe Labs Backend (/api/agent/chat)
                              │
                              ▼
                        Claude MCP Server
                              │
                              ▼
                    MCP Tools (balance, price, etc.)
                              │
                              ▼
                    Trading Bridge API
```

### Enhanced MCP Flow (With Hummingbot)

```
User Chat → Admin UI → Pipe Labs Backend (/api/agent/chat)
                              │
                              ▼
                        Claude MCP Server
                              │
                              ▼
                    MCP Tools (NEW: bot management)
                              │
                              ├──▶ Trading Bridge API
                              │         │
                              │         ▼
                              │    Hummingbot API
                              │
                              └──▶ Direct Trading Bridge
                                      (for balances, prices)
```

---

## MCP Tools to Expose

### 1. Bot Management Tools

**File:** `pipelabs-dashboard/app/mcp_tools/bot_tools.py`

```python
from mcp import Tool
from typing import Optional

# Tool: List all bots
list_bots_tool = Tool(
    name="list_trading_bots",
    description="List all trading bots (running and stopped)",
    input_schema={
        "type": "object",
        "properties": {
            "chain": {
                "type": "string",
                "enum": ["all", "evm", "solana"],
                "description": "Filter by chain (all, evm, or solana)"
            },
            "status": {
                "type": "string",
                "enum": ["all", "running", "stopped"],
                "description": "Filter by status"
            }
        }
    }
)

# Tool: Create a bot
create_bot_tool = Tool(
    name="create_trading_bot",
    description="Create and start a new trading bot",
    input_schema={
        "type": "object",
        "required": ["name", "strategy", "connector", "pair"],
        "properties": {
            "name": {
                "type": "string",
                "description": "Bot name (e.g., 'sharp_spread_bot')"
            },
            "strategy": {
                "type": "string",
                "enum": ["spread", "volume"],
                "description": "Trading strategy"
            },
            "connector": {
                "type": "string",
                "description": "Exchange connector (bitmart, jupiter, etc.)"
            },
            "pair": {
                "type": "string",
                "description": "Trading pair (e.g., 'SHARP/USDT')"
            },
            "account": {
                "type": "string",
                "description": "Account name (default: 'client_sharp')"
            },
            "config": {
                "type": "object",
                "description": "Bot configuration (spread %, order size, etc.)"
            }
        }
    }
)

# Tool: Start a bot
start_bot_tool = Tool(
    name="start_trading_bot",
    description="Start a stopped trading bot",
    input_schema={
        "type": "object",
        "required": ["bot_id"],
        "properties": {
            "bot_id": {
                "type": "string",
                "description": "Bot ID or name"
            }
        }
    }
)

# Tool: Stop a bot
stop_bot_tool = Tool(
    name="stop_trading_bot",
    description="Stop a running trading bot",
    input_schema={
        "type": "object",
        "required": ["bot_id"],
        "properties": {
            "bot_id": {
                "type": "string",
                "description": "Bot ID or name"
            }
        }
    }
)

# Tool: Get bot status
get_bot_status_tool = Tool(
    name="get_bot_status",
    description="Get detailed status and performance of a bot",
    input_schema={
        "type": "object",
        "required": ["bot_id"],
        "properties": {
            "bot_id": {
                "type": "string",
                "description": "Bot ID or name"
            }
        }
    }
)

# Tool: Get bot performance
get_bot_performance_tool = Tool(
    name="get_bot_performance",
    description="Get trading performance metrics for a bot",
    input_schema={
        "type": "object",
        "required": ["bot_id"],
        "properties": {
            "bot_id": {
                "type": "string",
                "description": "Bot ID or name"
            },
            "days": {
                "type": "integer",
                "description": "Number of days to analyze (default: 7)"
            }
        }
    }
)
```

---

## Implementation Flow

### Step 1: Deploy Hummingbot to Railway

**Option A: Docker Compose on Railway**
```yaml
# railway.json or docker-compose.yml
services:
  hummingbot-api:
    image: hummingbot/hummingbot:latest
    ports:
      - "8000:8000"
    environment:
      - HUMMINGBOT_API_USERNAME=hummingbot
      - HUMMINGBOT_API_PASSWORD=${HUMMINGBOT_API_PASSWORD}
    volumes:
      - ./scripts:/app/scripts
      - ./conf:/app/conf
```

**Option B: Railway Native Service**
- Create new Railway service
- Use Hummingbot Docker image
- Set environment variables
- Expose port 8000

### Step 2: Update Trading Bridge

**Add HummingbotClient** (`trading-bridge/app/hummingbot_client.py`)

```python
import httpx
import os

class HummingbotClient:
    def __init__(self):
        # Use Railway service URL if same project, or external URL
        self.base_url = os.getenv(
            "HUMMINGBOT_API_URL", 
            os.getenv("HUMMINGBOT_SERVICE_URL", "http://localhost:8000")
        )
        self.username = os.getenv("HUMMINGBOT_API_USERNAME", "hummingbot")
        self.password = os.getenv("HUMMINGBOT_API_PASSWORD", "")
        
        self.auth = (self.username, self.password)
    
    async def get_status(self):
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/bot-orchestration/status",
                auth=self.auth
            )
            response.raise_for_status()
            return response.json()
    
    # ... other methods (start_bot, stop_bot, etc.)
```

**Railway Environment Variables:**
```bash
HUMMINGBOT_API_URL=http://hummingbot-api:8000  # Internal service URL
HUMMINGBOT_API_USERNAME=hummingbot
HUMMINGBOT_API_PASSWORD=<secure_password>
```

### Step 3: Add MCP Tools to Pipe Labs Backend

**File:** `pipelabs-dashboard/app/mcp_tools/bot_tools.py`

```python
from mcp import Tool
import httpx

TRADING_BRIDGE_URL = os.getenv("TRADING_BRIDGE_URL", "https://trading-bridge-production.up.railway.app")

async def list_trading_bots(chain: str = "all", status: str = "all"):
    """List all trading bots"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{TRADING_BRIDGE_URL}/bots")
        bots = response.json().get("bots", [])
        
        # Filter by chain
        if chain != "all":
            bots = [b for b in bots if b.get("chain") == chain]
        
        # Filter by status
        if status != "all":
            bots = [b for b in bots if b.get("status") == status]
        
        return {
            "bots": bots,
            "count": len(bots)
        }

async def create_trading_bot(name: str, strategy: str, connector: str, pair: str, account: str = "client_sharp", config: dict = None):
    """Create and start a trading bot"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{TRADING_BRIDGE_URL}/bots/create",
            json={
                "name": name,
                "strategy": strategy,
                "connector": connector,
                "pair": pair,
                "account": account,
                "config": config or {}
            }
        )
        return response.json()

# ... other tool implementations
```

**Register tools in MCP server:**
```python
# pipelabs-dashboard/app/mcp_server.py
from app.mcp_tools.bot_tools import (
    list_trading_bots,
    create_trading_bot,
    start_trading_bot,
    stop_trading_bot,
    get_bot_status,
    get_bot_performance
)

mcp_server.register_tool(list_trading_bots_tool, list_trading_bots)
mcp_server.register_tool(create_bot_tool, create_trading_bot)
# ... register other tools
```

---

## User Experience Flow

### Example 1: Create Bot via Chat

**User:** "Create a spread bot for SHARP/USDT on BitMart"

**Claude MCP:**
1. Recognizes intent → calls `create_trading_bot` tool
2. Tool calls Trading Bridge `/bots/create`
3. Trading Bridge calls Hummingbot API
4. Bot starts trading
5. Claude responds: "✅ Created 'sharp_spread_bot' and started trading SHARP/USDT on BitMart"

### Example 2: Check Bot Status

**User:** "Show me all running bots"

**Claude MCP:**
1. Calls `list_trading_bots(status="running")`
2. Gets list from Trading Bridge
3. Formats response: "You have 3 bots running: sharp_spread_bot, sol_jupiter_bot, ..."

### Example 3: Stop Bot

**User:** "Stop the SHARP bot"

**Claude MCP:**
1. Calls `list_trading_bots` to find bot
2. Calls `stop_trading_bot(bot_id="sharp_spread_bot")`
3. Confirms: "✅ Stopped sharp_spread_bot"

---

## Benefits of MCP Integration

### 1. **Natural Language Bot Management**
- Users can manage bots through chat
- No need to navigate UI for simple operations
- Faster workflow for power users

### 2. **Intelligent Bot Creation**
- Claude can suggest optimal configurations
- "Create a bot with 0.3% spread" → Claude sets config
- "Create volume bot for $10k daily" → Claude calculates parameters

### 3. **Proactive Monitoring**
- Claude can monitor bot performance
- Alert on unusual activity
- Suggest optimizations

### 4. **Multi-Step Operations**
- "Create SHARP bot and check balance" → Claude does both
- "Stop all EVM bots" → Claude stops multiple bots
- "Show me best performing bot" → Claude analyzes and reports

---

## Implementation Timeline

### Week 1: Infrastructure
- [ ] Deploy Hummingbot to Railway
- [ ] Set up environment variables
- [ ] Test Hummingbot API connectivity

### Week 2: Trading Bridge Integration
- [ ] Add HummingbotClient class
- [ ] Update bot routes
- [ ] Test bot creation/start/stop

### Week 3: MCP Integration
- [ ] Create MCP bot tools
- [ ] Register tools in MCP server
- [ ] Test chat commands

### Week 4: Testing & Polish
- [ ] End-to-end testing
- [ ] Error handling
- [ ] Documentation

---

## Security Considerations

### 1. **Authentication**
- Hummingbot API credentials stored in Railway secrets
- Trading Bridge authenticates with Hummingbot
- MCP tools require admin authentication

### 2. **Authorization**
- Only admins can create/manage bots via MCP
- Bot operations logged for audit
- Rate limiting on bot creation

### 3. **Error Handling**
- Graceful degradation if Hummingbot unavailable
- Clear error messages in chat
- Fallback to UI for complex operations

---

## Recommendation Summary

### ✅ **Recommended Architecture:**

1. **Deploy Hummingbot to Railway** (same project as Trading Bridge)
   - Use Railway service URL for internal communication
   - No VPN/tunnel needed
   - Easy to scale

2. **Add MCP Tools for Bot Management**
   - Expose bot operations via MCP
   - Enable natural language bot management
   - Enhance user experience

3. **Keep Trading Bridge as Middleware**
   - Trading Bridge handles Hummingbot communication
   - MCP tools call Trading Bridge (not Hummingbot directly)
   - Clean separation of concerns

### 🎯 **Key Benefits:**

- ✅ **No network complexity** - All services in same cloud
- ✅ **Natural language bot management** - Users can chat with bots
- ✅ **Scalable** - Can add more Hummingbot instances
- ✅ **Maintainable** - Clear architecture, easy to debug

---

## Next Steps

1. **Deploy Hummingbot to Railway**
   ```bash
   # Create new Railway service
   # Use Hummingbot Docker image
   # Set environment variables
   ```

2. **Update Trading Bridge**
   - Add HummingbotClient
   - Update bot routes
   - Set Railway environment variables

3. **Add MCP Tools**
   - Create bot_tools.py
   - Register tools in MCP server
   - Test with chat

4. **Test End-to-End**
   - Create bot via chat
   - Verify bot starts
   - Check bot status via chat

---

**This architecture provides the best balance of simplicity, scalability, and user experience.**
