# Solana Signature Debugging Guide

## Current Issue
**"Invalid signature"** error from backend after successful signing.

## What to Check

### 1. Browser Console Logs
When you try to log in with Solana wallet, check browser console for:

```
📝 Signing message: [the exact message]
📝 Message bytes length: [number]
✅ Signature (raw bytes): [Uint8Array]
✅ Signature (base58): [base58 string]
🔐 Verifying signature with payload: {
  wallet_address: "...",
  message: "...",
  signature: "...",
  messageLength: [number],
  signatureLength: [number]
}
```

**Please share these console logs** so we can see what's being sent.

### 2. Backend Logs
Check backend logs (Railway dashboard → trading-bridge → Logs) for:

- Error messages from `verify_solana_signature()`
- "Solana signature verification failed: [error]"
- What address format is being received
- Any exceptions during verification

### 3. Backend Status Check

**Question for backend dev:**
- Is Solana signature verification implemented in `/auth/verify`?
- If yes, what error is backend seeing?
- If no, can you implement it? (See `BACKEND_SOLANA_AUTH_CODE.md`)

## Possible Issues

### Issue 1: Backend Not Implemented
**Symptom:** Backend treats Solana address as EVM address
**Fix:** Implement Solana verification (see `BACKEND_SOLANA_AUTH_CODE.md`)

### Issue 2: Message Format Mismatch
**Symptom:** Backend verifies different message than what was signed
**Possible cause:** Phantom might add a prefix automatically
**Fix:** Backend needs to verify the exact message that was signed

### Issue 3: Signature Format Mismatch
**Symptom:** Backend expects different signature format
**Current:** Frontend sends base58 encoded signature
**Backend expects:** Base58 decoded bytes for verification

## Quick Test

**In browser console (after connecting Phantom):**

```javascript
// Get the message from backend
const walletAddress = "YOUR_SOLANA_ADDRESS";
const res = await fetch(`https://trading-bridge-production.up.railway.app/auth/message/${walletAddress}`);
const { message } = await res.json();

// Sign it
const encodedMessage = new TextEncoder().encode(message);
const { signature } = await window.solana.signMessage(encodedMessage, "utf8");
const signatureBase58 = bs58.encode(signature);

console.log('Message:', message);
console.log('Message bytes:', encodedMessage);
console.log('Signature (base58):', signatureBase58);

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

console.log('Verify response:', await verifyRes.json());
```

## Next Steps

1. **Check browser console** - Share the logs
2. **Check backend logs** - Share any errors
3. **Confirm backend status** - Is Solana verification implemented?
4. **Test with curl** - Try manual verification (see `BACKEND_SOLANA_AUTH_CODE.md`)

---

**Most likely:** Backend doesn't have Solana verification implemented yet, or it's not detecting Solana addresses correctly.
