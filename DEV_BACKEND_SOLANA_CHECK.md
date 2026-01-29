# Backend Dev: Solana Signature Verification Check

## Issue
Frontend is getting **"Invalid signature"** error when trying to log in with Solana wallets.

## What Frontend is Sending

The frontend sends to `/auth/verify`:
```json
{
  "wallet_address": "ABC123...",  // Base58 Solana public key (32-44 chars, no 0x prefix)
  "message": "Sign this message to login to Pipe Labs Dashboard.\n\nWallet: ABC123...\nTimestamp: 1234567890",
  "signature": "xyz789..."  // Base58 encoded signature (64 bytes when decoded)
}
```

## What Backend Needs to Do

### 1. Check if Solana Verification is Implemented

**File:** `trading-bridge/app/auth_routes.py` (or wherever `/auth/verify` is)

**Question:** Is there code that detects Solana addresses and calls `verify_solana_signature()`?

**Expected code:**
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
        # EVM verification (ECDSA)
        valid = verify_evm_signature(...)
    
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid signature")
```

### 2. Check if `verify_solana_signature()` Function Exists

**Question:** Does this function exist in the backend?

**Expected function:**
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

### 3. Check Dependencies

**Question:** Are these packages installed?

**Required packages:**
- `pynacl` (for ed25519 verification)
- `base58` (for base58 decoding)

**Check:** `requirements.txt` or `pyproject.toml`

### 4. Check Backend Logs

**When testing Solana login, check backend logs for:**
- Error messages from `verify_solana_signature()`
- What address format is being received
- Any exceptions during verification

## Quick Test

**Can you test this in backend?**

```python
# Test Solana signature verification
import base58
from nacl.signing import VerifyKey

# Example Solana address (replace with real one)
wallet_address = "YOUR_SOLANA_ADDRESS"
message = "Test message"
signature = "YOUR_BASE58_SIGNATURE"

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

## What We Need to Know

1. **Is Solana verification implemented?** (Yes/No)
2. **If yes, what error is backend seeing?** (Check logs)
3. **If no, can you implement it?** (See `BACKEND_SOLANA_AUTH_CODE.md` for exact code)

## Frontend Status

✅ Frontend is ready:
- Detects Phantom wallet
- Connects and gets Solana address
- Signs message correctly
- Sends base58 signature to `/auth/verify`
- Handles errors gracefully

**Frontend is deployed and working** - just waiting for backend to verify signatures correctly.

---

**Please check backend and let us know:**
1. Is Solana verification code deployed?
2. What error is backend seeing?
3. Do you need the exact implementation code? (It's in `BACKEND_SOLANA_AUTH_CODE.md`)
