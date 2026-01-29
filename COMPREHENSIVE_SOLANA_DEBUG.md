# Comprehensive Solana Signature Debugging

## Current Issue
**Still getting "Invalid signature"** - Need to debug systematically

## What We Know

✅ **Frontend signing works** - No "Expected Buffer" errors  
✅ **Message is being signed** - Phantom accepts and signs  
❌ **Backend rejects signature** - Returns "Invalid signature"

## Possible Root Causes

### 1. Backend Not Implemented (Most Likely)
**Symptom:** Backend treats Solana as EVM  
**Check:** Does backend have `verify_solana_signature()` function?  
**Fix:** Implement Solana verification (see `CTO_BACKEND_SOLANA_IMPLEMENTATION.md`)

### 2. Message Format Mismatch
**Symptom:** Phantom signs different message than backend verifies  
**Possible causes:**
- Phantom adds prefix automatically (e.g., "Solana Signed Message:\n")
- Message encoding differs (UTF-8 vs bytes)
- Newline characters differ (\n vs \r\n)

**Check:** Compare exact message bytes being signed vs verified

### 3. Signature Format Issue
**Symptom:** Signature encoding/decoding mismatch  
**Possible causes:**
- Base58 encoding/decoding issue
- Signature length incorrect (should be 64 bytes)
- Phantom returns signature in different format

**Check:** Verify signature is exactly 64 bytes when decoded

### 4. Public Key Format Issue
**Symptom:** Public key doesn't match signer  
**Possible causes:**
- Address format mismatch
- Base58 decoding issue
- Wrong public key being used

**Check:** Verify public key matches the one that signed

## Systematic Debugging Approach

### Step 1: Verify Backend Implementation

**Check backend code:**
```bash
# In trading-bridge repo
cd trading-bridge
grep -r "verify_solana_signature" app/
grep -r "is_solana" app/auth_routes.py
grep -r "pynacl\|base58" requirements.txt
```

**If NOT found:** Backend needs implementation (most likely issue)

**If found:** Continue to Step 2

---

### Step 2: Add Detailed Logging to Backend

**Add to backend `verify_solana_signature()` function:**

```python
def verify_solana_signature(wallet_address: str, message: str, signature: str) -> bool:
    """Verify a Solana wallet signature (ed25519)"""
    try:
        print(f"[SOLANA DEBUG] Verifying signature")
        print(f"[SOLANA DEBUG] Wallet address: {wallet_address}")
        print(f"[SOLANA DEBUG] Wallet address length: {len(wallet_address)}")
        print(f"[SOLANA DEBUG] Message: {repr(message)}")
        print(f"[SOLANA DEBUG] Message length: {len(message)}")
        print(f"[SOLANA DEBUG] Signature: {signature[:20]}...")
        print(f"[SOLANA DEBUG] Signature length: {len(signature)}")
        
        # Decode the public key from base58
        public_key_bytes = base58.b58decode(wallet_address)
        print(f"[SOLANA DEBUG] Public key bytes length: {len(public_key_bytes)}")
        
        # Decode signature from base58
        signature_bytes = base58.b58decode(signature)
        print(f"[SOLANA DEBUG] Signature bytes length: {len(signature_bytes)}")
        
        # Message as bytes
        message_bytes = message.encode('utf-8')
        print(f"[SOLANA DEBUG] Message bytes length: {len(message_bytes)}")
        print(f"[SOLANA DEBUG] Message bytes: {message_bytes[:50]}...")
        
        # Verify using nacl (ed25519)
        verify_key = VerifyKey(public_key_bytes)
        verify_key.verify(message_bytes, signature_bytes)
        print(f"[SOLANA DEBUG] ✅ Verification successful!")
        return True
    except BadSignatureError as e:
        print(f"[SOLANA DEBUG] ❌ BadSignatureError: {e}")
        return False
    except Exception as e:
        print(f"[SOLANA DEBUG] ❌ Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False
```

**This will show exactly what backend is receiving and where it fails.**

---

### Step 3: Add Detailed Logging to Frontend

**Already added, but verify console shows:**
- Exact message being signed
- Signature bytes before encoding
- Signature base58 after encoding
- Full payload sent to backend

**Check browser console for:**
```
📝 Signing message: [exact message]
📝 Message bytes length: [number]
✅ Signature (raw bytes): [Uint8Array]
✅ Signature (base58): [string]
🔐 Verifying signature with payload: {...}
```

---

### Step 4: Compare Frontend vs Backend

**Create a test script to verify:**

```javascript
// In browser console after connecting Phantom
async function testSolanaSignature() {
  const walletAddress = "YOUR_SOLANA_ADDRESS";
  
  // Get message from backend
  const res = await fetch(`https://trading-bridge-production.up.railway.app/auth/message/${walletAddress}`);
  const { message } = await res.json();
  
  console.log('📝 Message from backend:', message);
  console.log('📝 Message length:', message.length);
  console.log('📝 Message bytes:', new TextEncoder().encode(message));
  
  // Sign
  const encodedMessage = new TextEncoder().encode(message);
  const { signature } = await window.solana.signMessage(encodedMessage, "utf8");
  const signatureBase58 = bs58.encode(signature);
  
  console.log('✅ Signature bytes length:', signature.length);
  console.log('✅ Signature (base58):', signatureBase58);
  console.log('✅ Signature (base58) length:', signatureBase58.length);
  
  // Try to verify
  const verifyRes = await fetch('https://trading-bridge-production.up.railway.app/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: walletAddress,
      message: message,
      signature: signatureBase58
    })
  });
  
  const result = await verifyRes.json();
  console.log('🔐 Verify response:', result);
  console.log('🔐 Status:', verifyRes.status);
}

testSolanaSignature();
```

---

### Step 5: Check Phantom Message Format

**Important:** Phantom might be signing with a prefix. Some wallets add:
- `"Solana Signed Message:\n"` prefix
- Message length prefix
- Other formatting

**Test if Phantom adds prefix:**

```javascript
// Test 1: Sign a simple message
const testMessage = "Hello";
const encoded = new TextEncoder().encode(testMessage);
const { signature } = await window.solana.signMessage(encoded, "utf8");

// Try to verify with and without prefix
// If backend expects prefix but we're not sending it, verification fails
```

**If Phantom adds prefix:**
- Backend needs to verify with the prefixed message
- Or frontend needs to send the prefixed message to backend

---

### Step 6: Verify Backend Logs

**Check Railway logs when Solana login is attempted:**

**Look for:**
1. `[SOLANA DEBUG]` messages (if logging added)
2. `"Solana signature verification failed"`
3. `"Invalid signature"` error
4. Any exceptions or stack traces

**If you see:**
- No Solana-specific logs → Backend not detecting Solana addresses
- EVM verification logs → Backend treating Solana as EVM
- Solana verification logs with errors → Implementation issue

---

## Most Likely Issues (Ranked)

### 1. Backend Not Implemented (90% likely)
- Backend doesn't have Solana verification
- Treating Solana addresses as EVM
- **Fix:** Implement Solana verification

### 2. Message Format Mismatch (5% likely)
- Phantom signs with prefix, backend verifies without
- Or vice versa
- **Fix:** Align message format

### 3. Signature Encoding Issue (3% likely)
- Base58 encoding/decoding bug
- Signature length incorrect
- **Fix:** Verify encoding matches

### 4. Public Key Issue (2% likely)
- Wrong public key used for verification
- Address format mismatch
- **Fix:** Verify public key format

---

## Action Plan

1. **First:** Check if backend has Solana verification implemented
   - Use `CTO_VERIFY_BACKEND_SOLANA.md` checklist
   - If not implemented → Implement it (see `CTO_BACKEND_SOLANA_IMPLEMENTATION.md`)

2. **If implemented:** Add detailed logging to backend
   - Add the debug logging above
   - Deploy and test
   - Check logs to see exactly where it fails

3. **Compare frontend and backend:**
   - Run test script in browser console
   - Check backend logs
   - Compare message, signature, public key formats

4. **Test message format:**
   - Check if Phantom adds prefix
   - Verify backend expects same format

5. **Fix the specific issue:**
   - Based on logs, fix the exact problem
   - Test again

---

## Quick Win: Test Backend Implementation Status

**Fastest way to check:**

```bash
# SSH into Railway or check backend code
# Look for verify_solana_signature function

# Or test via API:
# Try Solana login and check backend logs
# If you see EVM verification being called → Not implemented
# If you see Solana verification errors → Implementation bug
```

---

## Next Steps

1. **Verify backend implementation status** (most important)
2. **Add detailed logging** if implemented
3. **Compare frontend/backend** data formats
4. **Fix the specific issue** based on findings

**Don't repeat the same debugging cycle - verify backend first!**
