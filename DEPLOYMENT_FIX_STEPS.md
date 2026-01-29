# Deployment Fix - Step by Step

## ✅ Pre-Flight Check (COMPLETE)

- ✅ Code is correct (both buttons at lines 341, 376)
- ✅ Latest commit: `562a98e` pushed to GitHub
- ✅ Build works locally
- ✅ No syntax errors

---

## 🚀 Fix Steps (Do These Now)

### Step 1: Login to Railway Dashboard
1. Go to: https://railway.app
2. Login with your Railway account
3. Find `ai-trading-ui` service

### Step 2: Check Current Deployment
1. Click on `ai-trading-ui` service
2. Go to **"Deployments"** tab
3. Check latest deployment:
   - **Commit hash:** Is it `562a98e` or `e4a8987`?
   - **Status:** Is it "Success" or "Building"?
   - **Time:** When was it deployed?

**If latest is OLD (like `c6bcf370`):**
→ Auto-deploy is broken, go to Step 3

**If latest is NEW (`562a98e`):**
→ Deployment worked! Go to Step 6 to verify

### Step 3: Check Auto-Deploy Settings
1. Railway Dashboard → `ai-trading-ui` service
2. Click **"Settings"** tab
3. Click **"Source"** section
4. Verify:
   - ✅ Repository: `adminpipelabs/ai-trading-ui`
   - ✅ Branch: `main`
   - ✅ **Auto-deploy:** Should be **ENABLED** (toggle ON)

**If auto-deploy is OFF:**
→ Turn it ON, wait for deployment

**If auto-deploy is ON but not working:**
→ Go to Step 4

### Step 4: Manual Redeploy
1. Railway Dashboard → `ai-trading-ui` service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button (or "Deploy latest")
4. Wait for build to complete (2-5 minutes)
5. Check deployment logs for errors

**If redeploy works:**
→ Go to Step 6 to verify

**If redeploy fails:**
→ Go to Step 5

### Step 5: Reconnect GitHub (If Needed)
1. Railway Dashboard → Settings → Source
2. Click **"Disconnect"** GitHub repo
3. Click **"Connect GitHub"**
4. Select: `adminpipelabs/ai-trading-ui`
5. Select branch: `main`
6. Enable auto-deploy
7. Wait for first deployment

### Step 6: Verify Deployment
1. After deployment completes:
   - Check deployment logs
   - Look for build hash: Should be `main.719d2afc.js` (or newer)
   - Status should be "Success"

2. Test live site:
   - Go to: `app.pipelabs.xyz`
   - **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in **incognito/private window**

3. **Expected result:**
   - ✅ Should see **TWO buttons** side by side:
     - "Connect EVM Wallet" (blue gradient)
     - "Connect Solana Wallet" (purple gradient)
   - ✅ Old single button should be gone

---

## 🔍 Troubleshooting

### If buttons still don't show:

**Check browser console:**
1. Press `F12` → Console tab
2. Look for errors
3. Check Network tab → find `main.*.js`
4. Search for "Connect Solana Wallet" in response

**Clear browser cache:**
1. DevTools → Application tab
2. Click "Clear site data"
3. Hard refresh

**Check deployment hash:**
- Railway deployment logs should show: `main.719d2afc.js`
- If it shows old hash (`main.d8cb596b.js`), deployment didn't work

---

## ✅ Success Criteria

- [ ] Latest deployment shows commit `562a98e` or `e4a8987`
- [ ] Build hash is `main.719d2afc.js` (or newer)
- [ ] Live site shows TWO buttons
- [ ] Hard refresh shows new UI
- [ ] Auto-deploy works for future commits

---

## 📋 Quick Reference

**Latest commit:** `562a98e` - "Trigger Railway deployment"
**Expected build:** `main.719d2afc.js`
**Live URL:** `app.pipelabs.xyz`
**GitHub repo:** `adminpipelabs/ai-trading-ui` (main branch)

---

**Start with Step 1 - Check Railway Dashboard!**
