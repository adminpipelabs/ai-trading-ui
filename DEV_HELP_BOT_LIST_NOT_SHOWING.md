# Bot List Not Showing - Need Dev Help

## Status Summary

✅ **Build:** Fixed and passing  
✅ **Backend Fix:** Implemented (admin can see all bots)  
✅ **Bot Exists:** `726186c7-0f5e-44a2-8c7e-b2e01186c0e4` - "Lynk" - Status: running  
❌ **Frontend:** Bot list still not displaying

## What We've Done

### Backend (`trading-bridge/app/bot_routes.py`)
- ✅ Made `X-Wallet-Address` header optional
- ✅ Check if user is admin when wallet_address provided
- ✅ Admin users can see all bots
- ✅ Committed: `40fa40f`

### Frontend (`ai-trading-ui`)
- ✅ Fixed build error (`userRole` scope issue)
- ✅ Updated to handle admin users
- ✅ Added debug logging
- ✅ Committed: `aa168c9`

## Current Issue

**Backend endpoint:** `GET /bots`  
**Expected:** Admin should see all bots when providing wallet address  
**Actual:** Still getting 401 or empty list

## Questions for Dev

1. **Is the backend fix deployed?**
   - Check Railway logs for trading-bridge service
   - Is commit `40fa40f` deployed?
   - What does `/bots` endpoint return when called with admin wallet?

2. **How is admin role determined?**
   - Is it `client.role == "admin"`?
   - Is it `client.account_identifier == "admin"`?
   - What's the admin wallet address in the database?

3. **JWT Token:**
   - Does the JWT token contain role information?
   - Can we check admin status from token without wallet_address?
   - Should we decode JWT to get admin status?

4. **Testing:**
   ```bash
   # Test with admin wallet
   curl -H "X-Wallet-Address: BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV" \
     https://trading-bridge-production.up.railway.app/bots
   
   # What does this return?
   ```

## Debug Info Needed

**From browser console (after login):**
- What does `localStorage.getItem('user')` show?
- What's the `role` field value?
- What's the `wallet_address` value?

**From Network tab:**
- When calling `/bots`, what headers are sent?
- What's the response status code?
- What's the response body?

## Expected Flow

1. Admin logs in → wallet address stored in localStorage
2. Frontend calls `GET /bots` with `X-Wallet-Address` header
3. Backend checks wallet → finds client → checks if admin
4. If admin → returns all bots
5. Frontend displays bot list

## Current Bot Status

```json
{
  "id": "726186c7-0f5e-44a2-8c7e-b2e01186c0e4",
  "name": "Lynk",
  "status": "running",
  "account": "client_lynk",
  "bot_type": "volume"
}
```

Bot exists and is running - just need to display it in UI.

## Next Steps

1. Verify backend fix is deployed
2. Check admin wallet/role in database
3. Test `/bots` endpoint directly with admin wallet
4. Check if JWT token can be used instead of wallet_address header
5. Verify frontend is sending correct headers
