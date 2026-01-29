# CTO: Backend Solana Authentication Implementation

## Status
✅ **Frontend:** Complete and working  
❌ **Backend:** Needs Solana signature verification implementation  
🎯 **Task:** Add Solana signature verification to `/auth/verify` endpoint

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
pip install pynacl base58 --break-system-packages
```

**Add to `requirements.txt`:**
```
pynacl>=1.5.0
base58>=2.1.0
```

---

### Step 2: Add Solana Signature Verification Function

**File:** `trading-bridge/app/auth_routes.py` (or wherever `/auth/verify` is)

**Add imports at the top:**
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
    except (BadSignatureError, Exception):
        return False
```

---

### Step 3: Update `/auth/verify` Endpoint

**Find your existing `/auth/verify` endpoint and update it:**

```python
@router.post("/auth/verify")
async def verify_wallet(request: VerifyRequest):
    # Detect chain by address format
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
        # EVM verification (ECDSA) - existing code
        valid = verify_evm_signature(
            request.wallet_address,
            request.message,
            request.signature
        )
    
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # ... rest of your existing login logic:
    # - Find or create client by wallet_address
    # - Return user data and access_token
    # - Handle role assignment (admin/client)
    # ... (keep existing code here)
```

---

## What Frontend Sends

**Request to `/auth/verify`:**
```json
{
  "wallet_address": "ABC123...xyz",  // Base58 Solana public key (32-44 chars, no 0x)
  "message": "Sign this message to login to Pipe Labs Dashboard.\n\nWallet: ABC123...xyz\nTimestamp: 1234567890",
  "signature": "xyz789..."  // Base58 encoded signature (64 bytes when decoded)
}
```

**Format:**
- `wallet_address`: Base58 encoded Solana public key
- `message`: UTF-8 string (exact message from `/auth/message` endpoint)
- `signature`: Base58 encoded signature

---

## Testing

### Test with curl (after deployment):

**1. Get auth message:**
```bash
curl "https://trading-bridge-production.up.railway.app/auth/message/YOUR_SOLANA_ADDRESS"
# Should return: {"message": "Sign this message..."}
```

**2. Sign message with Phantom wallet** (in browser console):
```javascript
const message = "Sign this message...";
const encodedMessage = new TextEncoder().encode(message);
const { signature } = await window.solana.signMessage(encodedMessage, "utf8");
const signatureBase58 = bs58.encode(signature);
console.log('Signature:', signatureBase58);
```

**3. Verify signature:**
```bash
curl -X POST "https://trading-bridge-production.up.railway.app/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "YOUR_SOLANA_ADDRESS",
    "message": "Sign this message...",
    "signature": "YOUR_BASE58_SIGNATURE"
  }'
```

---

## Important Notes

- **Signature format:** Base58 encoded (not base64, not hex)
- **Algorithm:** Ed25519 (not ECDSA like EVM)
- **Address format:** Base58, 32-44 characters, no `0x` prefix
- **No breaking changes:** EVM login continues to work exactly as before

---

## Deployment Checklist

- [ ] Install `pynacl` and `base58` dependencies
- [ ] Add `verify_solana_signature()` function
- [ ] Update `/auth/verify` endpoint to detect Solana addresses
- [ ] Test with curl (see Testing section)
- [ ] Deploy to Railway
- [ ] Test end-to-end with Phantom wallet
- [ ] Register test Solana wallet in database (via admin panel)
- [ ] Verify Solana clients can log in

---

## Expected Behavior

### ✅ Success Case:
- Solana wallet connects
- Signs message
- Backend verifies signature correctly
- Returns access_token and user data
- Client can log in

### ❌ Error Cases:
- Invalid signature → 401 "Invalid signature"
- Unregistered wallet → 403/404 (your existing logic)
- Network error → Frontend shows error message

---

## Frontend Status

**Frontend is already deployed and working:**
- ✅ Detects Phantom wallet
- ✅ Connects and signs messages
- ✅ Sends base58 signature to `/auth/verify`
- ✅ Handles errors gracefully
- ✅ Shows two buttons (EVM + Solana)

**Once backend is deployed, Solana login will work immediately.**

---

## Questions?

- See `BACKEND_SOLANA_AUTH_CODE.md` for more details
- See `DEV_STATUS_SOLANA_AUTH.md` for current status
- Frontend code is in `src/pages/AdminDashboard.jsx` and `src/pages/Login.jsx`

---

**Ready to implement? Start with Step 1 - Install dependencies!**
