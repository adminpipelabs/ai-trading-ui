# Recreate Railway Service - Fresh Start

## Why This Will Work
- Clears all cached builds
- Fresh connection to GitHub
- No old deployment artifacts
- Clean slate

---

## Step-by-Step: Recreate Railway Service

### Step 1: Export Current Configuration
**Before deleting, save these:**

1. **Environment Variables:**
   - Railway Dashboard → `ai-trading-ui` → Settings → Variables
   - Note down ALL environment variables:
     - `REACT_APP_TRADING_BRIDGE_URL` (or similar)
     - Any other env vars
   - **Or:** Take screenshot

2. **Domain Configuration:**
   - Note custom domain: `app.pipelabs.xyz`
   - How it's configured

3. **Service Settings:**
   - Any special configurations
   - Resource limits
   - Region settings

### Step 2: Delete Old Service
1. Railway Dashboard → `ai-trading-ui` service
2. Click **Settings** tab
3. Scroll to bottom
4. Click **"Delete Service"** or **"Remove"**
5. Confirm deletion

### Step 3: Create New Service
1. Railway Dashboard → **"New Project"** or **"New Service"**
2. Select **"Deploy from GitHub repo"**
3. Choose repository: `adminpipelabs/ai-trading-ui`
4. Select branch: `main`
5. Railway will auto-detect Dockerfile

### Step 4: Configure New Service
1. **Set Environment Variables:**
   - Add back all variables from Step 1
   - Especially: `REACT_APP_TRADING_BRIDGE_URL`

2. **Configure Domain:**
   - Settings → Networking → Custom Domain
   - Add: `app.pipelabs.xyz`
   - Configure DNS if needed

3. **Enable Auto-Deploy:**
   - Settings → Source
   - Verify: Auto-deploy is **ENABLED**
   - Branch: `main`

### Step 5: Wait for First Deployment
1. Railway will automatically start building
2. Wait 3-5 minutes for build to complete
3. Check build logs for success
4. Verify deployment shows commit `4671a4d` (or latest)

### Step 6: Verify Deployment
1. **Check Build Logs:**
   - Should see: `Compiled successfully`
   - Should produce: `main.719d2afc.js` (NOT `main.d8cb596b.js`)

2. **Check HTTP Logs:**
   - After deployment, check HTTP logs
   - Should see: `GET /static/js/main.719d2afc.js`
   - NOT: `GET /static/js/main.d8cb596b.js`

3. **Test Live Site:**
   - Go to: `app.pipelabs.xyz`
   - Hard refresh: `Ctrl+Shift+R`
   - **Expected:** TWO buttons visible

---

## Alternative: Deploy to Vercel (Faster)

If Railway keeps having issues:

1. **Go to:** https://vercel.com
2. **Sign in** with GitHub
3. **Import Project:**
   - Repository: `adminpipelabs/ai-trading-ui`
   - Framework: Create React App (auto-detected)
4. **Configure:**
   - Add environment variables
   - Deploy
5. **Get new URL** (takes 2 minutes)
6. **Test** Solana login

**Then:** Update DNS to point to Vercel, or use Vercel URL temporarily

---

## What to Save Before Deleting

**Critical:**
- ✅ Environment variables (especially API URLs)
- ✅ Custom domain configuration
- ✅ Any service-specific settings

**Not Critical:**
- ❌ Old deployments (will be lost, but that's fine)
- ❌ Old build cache (we want to clear this anyway)

---

## Expected Timeline

- **Export config:** 2 minutes
- **Delete service:** 1 minute
- **Create new service:** 2 minutes
- **First deployment:** 3-5 minutes
- **Total:** ~10 minutes

---

## After Recreation

**Verify:**
- [ ] Latest commit deployed (`4671a4d` or newer)
- [ ] Build hash is `main.719d2afc.js`
- [ ] HTTP logs show new build file
- [ ] Live site shows TWO buttons
- [ ] Auto-deploy works for future commits

---

**Ready to recreate? Start with Step 1 - Export environment variables!**
