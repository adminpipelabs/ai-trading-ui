# Backend Dev: Solana Authentication Status

## Current Status
**Frontend:** ✅ Complete and working  
**Backend:** ❌ Returning "Invalid signature" error  
**Issue:** Backend verification failing for Solana wallet signatures

---

## What Frontend is Doing (Correctly)

### 1. Wallet Connection ✅
- Detects Phantom wallet via `window.solana.isPhantom`
- Connects and gets Solana public key (base58 address)
- Example address format: `ABC123...xyz` (32-44 chars, no `0x` prefix)

### 2. Message Signing ✅
- Gets auth message from `/auth/message/{walletAddress}` endpoint
- Encodes message to `Uint8Array` using `TextEncoder`
- Signs with Phantom: `window.solana.signMessage(encodedMessage, "utf8")`
- Encodes signature to base58 using `bs58` library
- **Signature format:** Base58 encoded string (64 bytes when decoded)

### 3. Verification Request ✅
Sends to `/auth/verify`:
```json
{
  "wallet_address": "ABC123...xyz",  // Base58 Solana public key
  "message": "Sign this message to login to Pipe Labs Dashboard.\n\nWallet: ABC123...xyz\nTimestamp: 1234567890",
  "signature": "xyz789..."  // Base58 encoded signature
}
```

---

## Error We're Getting

**Error:** `401 Invalid signature`  
**When:** After successful signing, when backend tries to verify  
**Status:** Frontend signing works, backend verification fails

---

## What Backend Needs to Check

### 1. Is Solana Verification Implemented?

**Check:** `trading-bridge/app/auth_routes.py` (or wherever `/auth/verify` is)

**Question:** Does `/auth/verify` detect Solana addresses and call Solana verification?

**Expected detection logic:**
```python
# Solana: base58, 32-44 chars, doesn't start with 0x
# EVM: starts with 0x, 42 chars total
is_solana = not request.wallet_address.startswith("0x") and len(request.wallet_address) >= 32
```

**If NOT implemented:** Backend is probably trying to verify Solana signatures using EVM (ECDSA) logic, which will always fail.

---

### 2. Does `verify_solana_signature()` Function Exist?

**Check:** Does this function exist in backend?

**Required function:**
```python
import base58
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

def verify_solana_signature(wallet_address: str, message: str, signature: str) -> bool:
    """Verify a Solana wallet signature (ed25519)"""
    try:
        # Decode the public key from base58
        public_key_bytes = base58.b58decode(wallet_address)
        
        # Decode signature from base58
        signature_bytes = base58.b58decode(signature)
        
        # Message as bytes
        message_bytes = message.encode('utf-8')
        
        # Verify using nacl (ed25519)
        verify_key = VerifyKey(public_key_bytes)
        verify_key.verify(message_bytes, signature_bytes)
        return True
    except (BadSignatureError, Exception) as e:
        print(f"Solana signature verification failed: {e}")
        return False
```

**Required packages:**
- `pynacl` (for ed25519 verification)
- `base58` (for base58 decoding)

---

### 3. Check Backend Logs

**When Solana login is attempted, check backend logs for:**

1. **Is Solana address detected?**
   - Look for logs showing address detection logic
   - Should see: `is_solana = True` or similar

2. **What error is verification throwing?**
   - Look for: `"Solana signature verification failed: [error]"`
   - Check exception messages

3. **Is it calling EVM verification instead?**
   - If backend logs show EVM verification being called for Solana addresses, that's the problem

---

## Expected Backend Code

**In `/auth/verify` endpoint:**

```python
@router.post("/auth/verify")
async def verify_wallet(request: VerifyRequest):
    # Detect Solana vs EVM
    is_solana = not request.wallet_address.startswith("0x") and len(request.wallet_address) >= 32
    
    if is_solana:
        # Solana verification (ed25519)
        valid = verify_solana_signature(
            request.wallet_address,
            request.message,
            request.signature
        )
    else:
        # EVM verification (ECDSA) - existing code
        valid = verify_evm_signature(
            request.wallet_address,
            request.message,
            request.signature
        )
    
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Rest of your existing logic...
    # - Find or create client by wallet_address
    # - Return user data and access_token
```

---

## Quick Test

**Test Solana verification manually:**

```python
import base58
from nacl.signing import VerifyKey

# Get these from frontend console logs when user tries to login
wallet_address = "YOUR_SOLANA_ADDRESS"  # From frontend
message = "Sign this message..."  # Exact message from backend
signature = "YOUR_BASE58_SIGNATURE"  # From frontend

try:
    public_key_bytes = base58.b58decode(wallet_address)
    signature_bytes = base58.b58decode(signature)
    message_bytes = message.encode('utf-8')
    
    verify_key = VerifyKey(public_key_bytes)
    verify_key.verify(message_bytes, signature_bytes)
    print("✅ Signature valid!")
except Exception as e:
    print(f"❌ Verification failed: {e}")
```

---

## What We Need From You

1. **Is Solana verification implemented?** (Yes/No)
2. **If yes, what error do you see in backend logs?**
3. **If no, can you implement it?** (See `BACKEND_SOLANA_AUTH_CODE.md` for exact code)

---

## Frontend Debug Info

**Frontend sends:**
- `wallet_address`: Base58 Solana public key (32-44 chars)
- `message`: UTF-8 string (exact message from `/auth/message` endpoint)
- `signature`: Base58 encoded signature (64 bytes when decoded)

**Frontend console logs show:**
- Message being signed
- Signature (base58)
- Payload sent to backend

**Frontend is working correctly** - issue is in backend verification.

---

## Files to Check

- `BACKEND_SOLANA_AUTH_CODE.md` - Complete implementation guide
- `DEV_BACKEND_SOLANA_CHECK.md` - Detailed checklist
- `SOLANA_SIGNATURE_DEBUG.md` - Debugging steps

---

**Please check backend and let us know what you find!**
