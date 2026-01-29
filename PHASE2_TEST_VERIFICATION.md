# Phase 2 Test Verification

## Issues Found & Fixed

### 1. API Endpoint Path
✅ **Correct:** `/bots/create` (not `/bots`)
- Router prefix: `/bots`
- Route: `/create`
- Full path: `/bots/create`

### 2. Request Model Mismatch
❌ **Issue:** Test uses `client_id` but API expects `account`
✅ **Fix:** Use `account` (matches `client.account_identifier`)

### 3. Missing Required Fields
❌ **Issue:** Test missing `name` (required field)
✅ **Fix:** Add `name` field

### 4. Missing Wallets
❌ **Issue:** Solana bots require wallets
✅ **Fix:** Add `wallets` array

## Corrected Test Command

```bash
curl -X POST https://trading-bridge-production.up.railway.app/bots/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Volume Bot",
    "account": "client_lynk",
    "bot_type": "volume",
    "config": {
      "base_mint": "HZG1RVn4zcRM7zEFEVGYPGoPzPAWAj2AAdvQivfmLYNK",
      "quote_mint": "So11111111111111111111111111111111111111112",
      "daily_volume_usd": 10000,
      "min_trade_usd": 100,
      "max_trade_usd": 500,
      "interval_min_seconds": 900,
      "interval_max_seconds": 2700,
      "slippage_bps": 50
    },
    "wallets": [
      {
        "address": "YOUR_WALLET_ADDRESS_HERE",
        "private_key": "YOUR_PRIVATE_KEY_HERE"
      }
    ]
  }'
```

## Pre-Test Checklist

### 1. Set ENCRYPTION_KEY ✅
```bash
# Generate key:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Add to Railway:
# Railway → trading-bridge → Variables → Add ENCRYPTION_KEY
```

### 2. Verify Client Exists
```bash
# Get client account_identifier:
curl https://trading-bridge-production.up.railway.app/clients

# Look for client with account_identifier like "client_lynk"
```

### 3. Test Bot Creation
Use the corrected command above with:
- Valid `account` (must match existing client)
- Valid Solana wallet `address` and `private_key`

## Expected Response

**Success (201):**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "account": "client_lynk",
  "name": "Test Volume Bot",
  "bot_type": "volume",
  "status": "stopped",
  "config": {...},
  "stats": {},
  "chain": "solana",
  "created_at": "2026-01-28T..."
}
```

**Error Cases:**
- `400` - Missing required fields (`name`, `account`)
- `400` - Client not found (invalid `account`)
- `400` - Encryption failed (ENCRYPTION_KEY not set)
- `500` - Database error

## Code Review Findings

### ✅ Good:
- Wallet encryption properly implemented
- Error handling for missing encryption key
- Proper validation of Solana vs Hummingbot bots
- Wallets are encrypted before storage

### ⚠️ Potential Issues:
1. **No validation** that `bot_type` is one of `['volume', 'spread']` - accepts any string
2. **No validation** of wallet address format (should be base58, 32-44 chars)
3. **No validation** of private key format (should be base58)
4. **Missing** validation that config has required fields for bot_type

### 🔧 Suggested Fixes (Optional):
```python
# Add to CreateBotRequest validation:
if request.bot_type and request.bot_type not in ['volume', 'spread']:
    raise HTTPException(400, "bot_type must be 'volume' or 'spread'")

# Validate wallet format:
if is_solana_bot and request.wallets:
    for wallet in request.wallets:
        if not (32 <= len(wallet['address']) <= 44):
            raise HTTPException(400, "Invalid Solana wallet address format")
```

## Next Steps

1. ✅ Set ENCRYPTION_KEY in Railway
2. ✅ Test bot creation with corrected command
3. ✅ Verify bot appears in database
4. ✅ Test GET /bots/{id} to retrieve bot
5. ✅ Test GET /bots/{id}/stats
6. ✅ Test POST /bots/{id}/wallets

If all tests pass → **Proceed to Phase 3**
