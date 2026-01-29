# Wallet Address Not Being Stored After Login - Debug Request

## Problem
Bot list shows "Wallet address: NOT FOUND" even after successful login, causing 401 errors when fetching bots.

## Current Flow

### 1. Login Process (`src/pages/Login.jsx`)
```javascript
// User signs message with wallet
const walletAddress = "BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"

// Login function called with:
login({
  user: data.user,           // Backend response user object
  access_token: data.access_token,
  wallet_address: walletAddress  // ✅ We pass it here
});
```

### 2. AuthContext Login (`src/contexts/AuthContext.jsx`)
```javascript
const login = (authData) => {
  const userObj = authData.user || authData;
  const walletAddress = userObj.wallet_address || authData.wallet_address || userObj.wallet;
  
  const userData = {
    id: userObj.id,
    email: userObj.email,
    wallet_address: walletAddress,  // ✅ Should be stored here
    role: userObj.role,
    name: userObj.email || walletAddress?.slice(0, 8) + '...',
  };
  
  localStorage.setItem('user', JSON.stringify(userData));  // ✅ Should save it
  localStorage.setItem('access_token', token);
  return userData;
};
```

### 3. API Call (`src/services/api.js`)
```javascript
// When fetching bots, we try to get wallet address:
const userStr = localStorage.getItem('user') || localStorage.getItem('pipelabs_user');
if (userStr) {
  const user = JSON.parse(userStr);
  walletAddress = user.wallet_address;  // ❌ This is undefined/null
}
```

## What We've Tried

1. ✅ Added `wallet_address` parameter to login call
2. ✅ Updated AuthContext to accept `authData.wallet_address`
3. ✅ Added debug logging
4. ✅ Checked localStorage keys ('user' and 'pipelabs_user')

## Console Output Shows

```
✅ Login successful: "User role: admin"
✅ Token present: YES
❌ Wallet address: NOT FOUND
```

## Questions for Dev

1. **What does the backend `/auth/verify` endpoint return?**
   - Does `data.user` include `wallet_address`?
   - What's the exact structure of the response?

2. **Is localStorage being cleared somewhere?**
   - Maybe another component is clearing it?
   - Or browser security settings?

3. **Is the wallet address being stored but in wrong format?**
   - Check: `localStorage.getItem('user')` in console
   - What does it actually contain?

4. **Should we check a different localStorage key?**
   - Maybe it's stored under a different name?

## Quick Debug Steps

**In browser console, after login:**
```javascript
// Check what's actually stored
console.log('user:', localStorage.getItem('user'));
console.log('pipelabs_user:', localStorage.getItem('pipelabs_user'));

// Parse and check
const user = JSON.parse(localStorage.getItem('user'));
console.log('wallet_address:', user?.wallet_address);
```

**Check backend response:**
```javascript
// In Login.jsx, after line 224 (data = await res.json())
console.log('Backend login response:', JSON.stringify(data, null, 2));
```

## Expected vs Actual

**Expected:**
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "wallet_address": "BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV",
    "role": "admin"
  },
  "access_token": "..."
}
```

**Need to verify:**
- What does backend actually return?
- Is wallet_address in the response?
- Is it being stored correctly?

## Files Changed

- `src/pages/Login.jsx` - Pass wallet_address to login()
- `src/contexts/AuthContext.jsx` - Accept and store wallet_address
- `src/services/api.js` - Try to read wallet_address from localStorage

## Next Steps

1. Check backend response structure
2. Verify localStorage contents after login
3. Check if wallet_address field name matches (maybe it's `wallet` or `address`?)
4. Add more defensive checks in apiCall to handle missing wallet_address
