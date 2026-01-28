# Backend Solana Authentication - Implementation Guide

## Overview
This document contains the exact code needed to add Solana wallet authentication to `pipelabs-backend`.

---

## Step 1: Install Dependencies

```bash
pip install pynacl base58
```

**Add to `requirements.txt`:**
```
pynacl>=1.5.0
base58>=2.1.0
```

---

## Step 2: Add Solana Signature Verification Function

**File:** `backend/app/auth_routes.py`

**Add these imports at the top:**
```python
import base58
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
```

**Add this function (before the `/auth/verify` endpoint):**
```python
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

---

## Step 3: Update `/auth/verify` Endpoint

**Find your existing `/auth/verify` endpoint and update it:**

```python
@router.post("/verify")
async def verify_wallet(request: VerifyRequest):
    # Detect wallet type by address format
    # Solana: base58, 32-44 chars, doesn't start with 0x
    # EVM: starts with 0x, 42 chars total
    is_solana = not request.wallet_address.startswith("0x") and len(request.wallet_address) >= 32
    
    if is_solana:
        # Solana verification (ed25519)
        valid = verify_solana_signature(
            request.wallet_address,
            request.message,
            request.signature
        )
    else:
        # Existing EVM verification (ECDSA)
        valid = verify_evm_signature(
            request.wallet_address,
            request.message,
            request.signature
        )
    
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Rest of your existing logic:
    # - Find or create client by wallet_address
    # - Return user data and access_token
    # - Handle role assignment (admin/client)
    # ... (keep existing code here)
```

---

## Step 4: Ensure `/auth/message/{walletAddress}` Accepts Solana Addresses

**Verify your `/auth/message/{walletAddress}` endpoint:**
- Should accept Solana addresses (base58, 32-44 chars)
- Should return a message for signing (same format as EVM)
- No changes needed if it already accepts any string

**Example:**
```python
@router.get("/auth/message/{wallet_address}")
async def get_auth_message(wallet_address: str):
    # Works for both EVM (0x...) and Solana (base58)
    message = f"Sign this message to login to Pipe Labs Dashboard.\n\nWallet: {wallet_address}\nTimestamp: {int(time.time())}"
    return {"message": message}
```

---

## Testing

### Test with curl (after deployment):

**1. Get auth message:**
```bash
curl "https://your-backend.up.railway.app/auth/message/YOUR_SOLANA_ADDRESS"
# Should return: {"message": "Sign this message..."}
```

**2. Sign message with Phantom wallet** (in browser console):
```javascript
const message = "Sign this message...";
const messageBytes = new TextEncoder().encode(message);
const signed = await window.solana.signMessage({
  message: messageBytes,
  display: 'utf8'
});
const signature = bs58.encode(signed.signature);
console.log('Signature:', signature);
```

**3. Verify signature:**
```bash
curl -X POST "https://your-backend.up.railway.app/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "YOUR_SOLANA_ADDRESS",
    "message": "Sign this message...",
    "signature": "YOUR_BASE58_SIGNATURE"
  }'
```

---

## Expected Behavior

### ✅ Success Case:
- Solana wallet connects
- Signs message
- Backend verifies signature
- Returns access_token and user data
- Client can log in

### ❌ Error Cases:
- Invalid signature → 401 "Invalid signature"
- Unregistered wallet → 403/404 (your existing logic)
- Network error → Frontend shows error message

---

## Frontend Integration

**Frontend is already deployed and ready:**
- Detects Phantom wallet
- Connects and signs messages
- Sends base58 signature to `/auth/verify`
- Handles errors gracefully

**Once backend is deployed:**
1. Test with a real Phantom wallet
2. Register the Solana address in database (via admin panel)
3. Try logging in with Solana wallet

---

## Notes

- **Signature format:** Base58 encoded (not base64, not hex)
- **Algorithm:** Ed25519 (not ECDSA)
- **Address format:** Base58, 32-44 characters
- **No breaking changes:** EVM login continues to work

---

## Deployment Checklist

- [ ] Install `pynacl` and `base58` dependencies
- [ ] Add `verify_solana_signature()` function
- [ ] Update `/auth/verify` endpoint to detect Solana addresses
- [ ] Test with curl (see Testing section)
- [ ] Deploy to Railway
- [ ] Test end-to-end with Phantom wallet
- [ ] Register test Solana wallet in database
- [ ] Verify Solana clients can log in

---

**Questions?** Check `SOLANA_LOGIN_FRONTEND_READY.md` for frontend details.
