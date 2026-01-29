# Backend Fix: Admin Bot List Should Not Require X-Wallet-Address Header

## Problem
GET `/bots` endpoint requires `X-Wallet-Address` header for all users, but **admin users should see all bots** without needing this header.

## Current Behavior
- All requests to `/bots` require `X-Wallet-Address` header
- Returns 401 if header is missing
- Admin users can't view bot list even though they're authenticated via JWT token

## Expected Behavior

### Admin Users
```
GET /bots
Headers: Authorization: Bearer <admin_jwt_token>
Response: { bots: [all bots from all clients] }
```
- ✅ Should NOT require `X-Wallet-Address` header
- ✅ Should check JWT token to verify admin role
- ✅ Should return ALL bots (no filtering)

### Client Users
```
GET /bots?account=client_lynk
Headers: 
  Authorization: Bearer <client_jwt_token>
  X-Wallet-Address: <client_wallet_address>
Response: { bots: [only client's bots] }
```
- ✅ Should require `X-Wallet-Address` header
- ✅ Should filter bots by client's account_identifier or wallet
- ✅ Should verify wallet matches authenticated client

## Backend Fix Needed

**File:** `app/bot_routes.py` (or wherever GET `/bots` is defined)

**Current code (example):**
```python
@router.get("/bots")
async def list_bots(
    account: Optional[str] = None,
    wallet_address: str = Header(..., alias="X-Wallet-Address")  # ❌ Required for all
):
    # ... returns bots
```

**Fixed code:**
```python
@router.get("/bots")
async def list_bots(
    account: Optional[str] = None,
    wallet_address: Optional[str] = Header(None, alias="X-Wallet-Address"),  # ✅ Optional
    current_user: User = Depends(get_current_user)  # ✅ Get user from JWT
):
    # Check if admin
    if current_user.role == "admin":
        # Admin sees all bots
        query = select(Bot)
        if account:
            query = query.where(Bot.account == account)
        bots = db.execute(query).scalars().all()
        return {"bots": [bot_to_dict(b) for b in bots]}
    
    # Client users need wallet address
    if not wallet_address:
        raise HTTPException(401, "X-Wallet-Address header required for client users")
    
    # Verify wallet belongs to client
    client = db.query(Client).filter_by(wallet_address=wallet_address).first()
    if not client or client.id != current_user.client_id:
        raise HTTPException(403, "Wallet address does not match authenticated client")
    
    # Return client's bots only
    query = select(Bot).where(Bot.client_id == current_user.client_id)
    if account:
        query = query.where(Bot.account == account)
    bots = db.execute(query).scalars().all()
    return {"bots": [bot_to_dict(b) for b in bots]}
```

## Key Changes

1. **Make `X-Wallet-Address` optional** - Use `Optional[str] = Header(None, ...)`
2. **Get user from JWT** - Use `Depends(get_current_user)` to get authenticated user
3. **Check role** - If admin, return all bots without wallet check
4. **Client validation** - If client, require wallet address and verify it matches

## Testing

**Test Admin:**
```bash
# Should work without X-Wallet-Address header
curl -H "Authorization: Bearer <admin_token>" \
  https://trading-bridge-production.up.railway.app/bots
```

**Test Client:**
```bash
# Should require X-Wallet-Address header
curl -H "Authorization: Bearer <client_token>" \
     -H "X-Wallet-Address: <client_wallet>" \
  https://trading-bridge-production.up.railway.app/bots?account=client_lynk
```

## Current Status

- ✅ Bot exists: `726186c7-0f5e-44a2-8c7e-b2e01186c0e4`
- ✅ Bot is running (started via curl)
- ❌ Frontend can't display it (401 error)
- ❌ Admin can't see bot list

## Priority

**HIGH** - Admin dashboard is blocked from viewing bots, which is core functionality.
