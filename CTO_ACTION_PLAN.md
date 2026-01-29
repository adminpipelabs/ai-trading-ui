# CTO Action Plan: Fix Railway Deployment

## Current Status
- ✅ Code is correct (both buttons in Login.jsx)
- ✅ Latest commit: `e4a8987` in GitHub
- ❌ Railway not deploying new commits
- ❌ Live site shows old build (`main.d8cb596b.js`)

---

## Immediate Actions

### Step 1: Check Railway Dashboard
1. Go to https://railway.app
2. Login to Railway dashboard
3. Find `ai-trading-ui` service
4. Check **Deployments** tab:
   - What's the latest deployment commit hash?
   - Is it `e4a8987` or older?
   - What's the deployment status?

### Step 2: Verify Auto-Deploy Settings
1. Railway Dashboard → `ai-trading-ui` service
2. Go to **Settings** → **Source**
3. Verify:
   - ✅ Repository: `adminpipelabs/ai-trading-ui`
   - ✅ Branch: `main`
   - ✅ Auto-deploy: **Enabled**

### Step 3: Check GitHub Webhook
1. Go to GitHub: https://github.com/adminpipelabs/ai-trading-ui/settings/hooks
2. Find Railway webhook
3. Check:
   - ✅ Is it active?
   - ✅ Last delivery status?
   - ✅ Any failed deliveries?

### Step 4: Manual Redeploy (If Needed)
1. Railway Dashboard → `ai-trading-ui` service
2. Click **"Redeploy"** or **"Deploy latest"**
3. Wait for build to complete
4. Check new deployment hash

### Step 5: Verify Deployment
1. After deployment completes:
   - Check deployment logs for errors
   - Verify new build hash matches local (`main.719d2afc.js`)
   - Test live site: `app.pipelabs.xyz`
   - Hard refresh: `Ctrl+Shift+R`

---

## If Auto-Deploy is Broken

### Option A: Reconnect GitHub
1. Railway Dashboard → Settings → Source
2. Click **"Disconnect"** GitHub repo
3. Click **"Connect GitHub"**
4. Select `adminpipelabs/ai-trading-ui`
5. Select `main` branch
6. Enable auto-deploy
7. Wait for first deployment

### Option B: Force New Deployment
Try one more commit to trigger webhook:
```bash
# Add a comment to trigger rebuild
echo "# Railway deploy trigger $(date)" >> README.md
git add README.md
git commit -m "Trigger Railway deployment"
git push
```

### Option C: Recreate Service (Last Resort)
1. Export environment variables (if any)
2. Note down service configuration
3. Delete `ai-trading-ui` service
4. Create new service
5. Connect to `adminpipelabs/ai-trading-ui`
6. Configure environment variables
7. Deploy

---

## Verification Checklist

After fix:
- [ ] Latest deployment shows commit `e4a8987`
- [ ] Build hash is `main.719d2afc.js` (or newer)
- [ ] Live site shows TWO buttons:
  - "Connect EVM Wallet" (blue)
  - "Connect Solana Wallet" (purple)
- [ ] Hard refresh shows new UI
- [ ] Auto-deploy works for future commits

---

## Quick Test Commands

**Verify code in repo:**
```bash
cd /Users/mikaelo/ai-trading-ui
git log --oneline -1
grep -n "Connect Solana Wallet" src/pages/Login.jsx
```

**Verify local build:**
```bash
npm run build
ls -la build/static/js/main.*.js
# Should see: main.719d2afc.js
```

---

## Expected Timeline

- **Check Railway:** 2 minutes
- **Fix auto-deploy:** 5 minutes
- **Manual redeploy:** 3-5 minutes
- **Verify:** 2 minutes

**Total:** ~15 minutes to fix

---

## Next Steps

1. **Right now:** Check Railway dashboard
2. **If broken:** Fix auto-deploy or manually redeploy
3. **Verify:** Test live site shows two buttons
4. **Document:** Note what was wrong for future reference

---

**Let's fix this deployment issue!**
