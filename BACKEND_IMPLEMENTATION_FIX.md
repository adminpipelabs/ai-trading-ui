# Backend Implementation: Fix GET /bots for Admin Users

## Priority: HIGH - Blocking admin dashboard

## File to Edit
`app/bot_routes.py` (or wherever GET `/bots` endpoint is defined)

## Current Issue
The endpoint requires `X-Wallet-Address` header for all users, blocking admin users from viewing bots.

## Implementation

Replace the current GET `/bots` endpoint with this:

```python
@router.get("/bots")
async def list_bots(
    request: Request,
    account: Optional[str] = None,
    client_id: Optional[str] = None
):
    """
    List bots - Admin sees all, clients see only their own
    """
    wallet_address = request.headers.get("X-Wallet-Address")
    
    # Get user from JWT token (if using JWT auth)
    # OR get user from wallet address
    user = None
    
    # Try to get user from JWT token first
    try:
        # If you have JWT auth middleware:
        # user = await get_current_user(request)
        # For now, get user from wallet or database lookup
        if wallet_address:
            user = await get_user_by_wallet(wallet_address)
    except:
        pass
    
    # Admin can list all bots (or filter by client_id)
    if user and user.role == "admin":
        if client_id:
            # Filter by specific client
            bots = await get_bots_by_client(client_id)
        elif account:
            # Filter by account identifier
            bots = await get_bots_by_account(account)
        else:
            # Return all bots
            bots = await get_all_bots()
        return {"bots": bots}
    
    # Non-admin must have wallet, only sees their bots
    if not wallet_address:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Please provide X-Wallet-Address header."
        )
    
    # Get client by wallet address
    client = await get_client_by_wallet(wallet_address)
    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found for wallet address"
        )
    
    # Return client's bots only
    if account:
        bots = await get_bots_by_account_and_client(account, client.id)
    else:
        bots = await get_bots_by_client(client.id)
    
    return {"bots": bots}
```

## Helper Functions Needed

You'll need these helper functions (or adapt to your existing code):

```python
async def get_user_by_wallet(wallet_address: str):
    """Get user/client by wallet address"""
    # Your implementation - query database
    pass

async def get_all_bots():
    """Get all bots from database"""
    # Your implementation
    pass

async def get_bots_by_client(client_id: str):
    """Get bots for a specific client"""
    # Your implementation
    pass

async def get_bots_by_account(account: str):
    """Get bots by account identifier"""
    # Your implementation
    pass

async def get_bots_by_account_and_client(account: str, client_id: str):
    """Get bots filtered by account and client"""
    # Your implementation
    pass

async def get_client_by_wallet(wallet_address: str):
    """Get client by wallet address"""
    # Your implementation
    pass
```

## Alternative: Using JWT Token (Recommended)

If you're using JWT authentication, use this approach instead:

```python
from fastapi import Depends
from your_auth_module import get_current_user

@router.get("/bots")
async def list_bots(
    account: Optional[str] = None,
    client_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)  # Get from JWT
):
    """
    List bots - Admin sees all, clients see only their own
    """
    # Admin can list all bots
    if current_user.role == "admin":
        query = select(Bot)
        if client_id:
            query = query.where(Bot.client_id == client_id)
        elif account:
            query = query.where(Bot.account == account)
        bots = db.execute(query).scalars().all()
        return {"bots": [bot_to_dict(b) for b in bots]}
    
    # Client users - only their bots
    query = select(Bot).where(Bot.client_id == current_user.client_id)
    if account:
        query = query.where(Bot.account == account)
    bots = db.execute(query).scalars().all()
    return {"bots": [bot_to_dict(b) for b in bots]}
```

## Testing

**Test Admin (should work without X-Wallet-Address):**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  https://trading-bridge-production.up.railway.app/bots
```

**Test Client (requires X-Wallet-Address):**
```bash
curl -H "Authorization: Bearer <client_token>" \
     -H "X-Wallet-Address: <client_wallet>" \
  https://trading-bridge-production.up.railway.app/bots?account=client_lynk
```

## Expected Result

After this fix:
- ✅ Admin can view all bots without X-Wallet-Address header
- ✅ Admin can filter by client_id or account
- ✅ Clients still require X-Wallet-Address header
- ✅ Clients only see their own bots

## Current Bot Status

- Bot ID: `726186c7-0f5e-44a2-8c7e-b2e01186c0e4`
- Name: "Lynk"
- Status: running
- Account: client_lynk

Once this is fixed, admin should see this bot in the UI immediately.
