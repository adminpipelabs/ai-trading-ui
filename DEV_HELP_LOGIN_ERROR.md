# Dev Help Request: Client Login Error

## Problem
Client cannot log in - getting "Failed to get authentication message from server" error.

## Current Setup
- **Frontend**: `ai-trading-ui` on Railway
- **Auth Backend**: `pipelabs-dashboard-production.up.railway.app` 
- **Data Backend**: `trading-bridge-production.up.railway.app`

## Error Flow
1. Client clicks "Connect Wallet" 
2. Wallet connects successfully (MetaMask)
3. Frontend calls: `https://pipelabs-dashboard-production.up.railway.app/api/auth/nonce/{walletAddress}`
4. **Error**: "Failed to get authentication message from server"

## Testing Results

### ✅ Endpoint Works from curl:
```bash
curl "https://pipelabs-dashboard-production.up.railway.app/api/auth/nonce/0x6cc52d4b397e0ddfdcd1ecbb37902003c4801685"
# Returns: {"message":"Sign this message...","timestamp":1769517235}
```

### ❌ Frontend fetch fails:
```javascript
const AUTH_BACKEND = 'https://pipelabs-dashboard-production.up.railway.app';
const nonceRes = await fetch(`${AUTH_BACKEND}/api/auth/nonce/${walletAddress}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
});
// Fails with network error or CORS issue
```

## Wallet Details
- **Wallet**: `0x6cc52d4b397e0ddfdcd1ecbb37902003c4801685`
- **Status**: Exists in trading-bridge as "Sharp Foundation" (client_sharp)
- **Issue**: Cannot authenticate via pipelabs-dashboard

## Questions for Dev
1. **Is the `/api/auth/nonce` endpoint accessible from the frontend domain?** (CORS issue?)
2. **Should we use trading-bridge for auth instead?** (Does trading-bridge have auth endpoints?)
3. **Is there a different auth flow we should use?**
4. **What's the correct way to authenticate clients who exist in trading-bridge?**

## Current Code Location
- Login component: `src/pages/Login.jsx` (lines 75-92)
- AdminDashboard wallet connect: `src/pages/AdminDashboard.jsx` (lines 2704-2707)

## What We Tried
1. ✅ Verified endpoint works from curl
2. ✅ Added better error handling
3. ✅ Fixed duplicate variable declarations
4. ❌ Still failing from browser

## Need Help With
**What's the correct authentication flow for clients?**
- Should auth go through trading-bridge?
- Should we create clients in pipelabs-dashboard first?
- Is there a CORS configuration issue?

**Please advise on the correct approach.**
