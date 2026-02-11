# Deploying BlindFold Frontend to Vercel

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/carlos-israelj/BlindFold
- ✅ Vercel account: https://vercel.com
- ✅ All environment variables ready (see below)

## 🚀 Deployment Steps

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub account and repository: `carlos-israelj/BlindFold`
4. Vercel will auto-detect Next.js

### Step 2: Configure Build Settings

**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `./` (leave as default - root of repo)
**Build Command:** `npx prisma generate && next build` (already in package.json)
**Output Directory:** `.next` (default)
**Install Command:** `npm install` (default)

### Step 3: Environment Variables

Add these in Vercel's "Environment Variables" section:

#### Database
```
DATABASE_URL=postgresql://neondb_owner:npg_YXHQDmc7RbM5@ep-purple-glade-aiobbfm0-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

#### Authentication
```
AUTH_SECRET=O/gcRAgCATXe8+fX38gfG+732K3iTEj1DC0px7il0Ew=
AUTH_URL=https://YOUR_APP.vercel.app
```
⚠️ **Important**: Replace `YOUR_APP` with your actual Vercel URL after first deploy!

#### NEAR AI Cloud
```
NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871
```

#### NOVA SDK
```
NOVA_API_KEY=nova_sk_36Py4LqkeHsNvM8rntiMP7aHxsSJ2fM6
NOVA_ACCOUNT_ID=cijimene5.nova-sdk.near
```

#### HOT Protocol
```
NEXT_PUBLIC_HOT_API_KEY=a0080f5a30894a629767e49bfd7f0f51
HOT_PARTNER_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb21haW4iOiJwYXkuaG90LWxhYnMub3JnIiwia2V5X2lkIjoxNCwidzNfdXNlcl9pZCI6MzgzNDYyNTIsInR5cGUiOiJ3aWJlMyJ9.T_0tQxID275jISwfGzXqayE1O34TPS4MNSt2y9-6KNo
HOT_WEBHOOK_SECRET=a328-fb7-8d94-4172
```

#### NEAR Network (Public)
```
NEXT_PUBLIC_NEAR_NETWORK=mainnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.mainnet.near.org
NEXT_PUBLIC_CONTRACT_ID=ecuador5.near
```

#### App URL (Public)
```
NEXT_PUBLIC_APP_URL=https://YOUR_APP.vercel.app
```
⚠️ **Important**: Update after first deploy!

#### Optional: WalletConnect (for better multi-chain UX)
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```
Get free at: https://cloud.walletconnect.com

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait ~3-5 minutes for build
3. Vercel will provide a URL like: `https://blindfold-xyz.vercel.app`

### Step 5: Update URLs (Important!)

After first deploy, you MUST update these environment variables with your real Vercel URL:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit these two variables:
   - `AUTH_URL` → `https://YOUR_ACTUAL_VERCEL_URL.vercel.app`
   - `NEXT_PUBLIC_APP_URL` → `https://YOUR_ACTUAL_VERCEL_URL.vercel.app`
3. Click "Save"
4. Go to Deployments tab → Click "Redeploy" on latest deployment

### Step 6: Verification

Visit your deployed app and verify:

1. **Homepage loads** ✅
2. **Database connection works** (check for Prisma errors in logs)
3. **Wallet connection** works (click "Connect Wallet")
4. **HOT Kit** loads (should show multi-chain wallet options)
5. **NEAR RPC** responds (check portfolio section)

## 🔍 Troubleshooting

### Build Fails - Prisma Error
**Error**: `Error: @prisma/client did not initialize yet`
**Solution**: Ensure build command includes `npx prisma generate`

### Runtime Error - AUTH_SECRET
**Error**: `AUTH_SECRET is required`
**Solution**: Make sure `AUTH_SECRET` is set in environment variables

### Wallet Connection Fails
**Error**: `Failed to connect wallet`
**Solution**:
- Check `NEXT_PUBLIC_NEAR_NETWORK=mainnet`
- Check `NEXT_PUBLIC_NEAR_RPC_URL` is accessible
- Try redeploying after updating URLs

### HOT Kit Not Loading
**Error**: `HOT Kit initialization failed`
**Solution**:
- Verify `NEXT_PUBLIC_HOT_API_KEY` is set
- Check browser console for errors
- Ensure `@hot-labs/kit` is in dependencies

### Database Connection Error
**Error**: `PrismaClientInitializationError`
**Solution**:
- Verify `DATABASE_URL` is correct
- Test connection: `npx prisma db push` locally
- Check Neon PostgreSQL is running

## 📊 Environment Variables Checklist

Copy this into Vercel's Environment Variables (one at a time):

- [ ] `DATABASE_URL`
- [ ] `AUTH_SECRET`
- [ ] `AUTH_URL` (update after first deploy!)
- [ ] `NEAR_AI_API_KEY`
- [ ] `NOVA_API_KEY`
- [ ] `NOVA_ACCOUNT_ID`
- [ ] `NEXT_PUBLIC_HOT_API_KEY`
- [ ] `HOT_PARTNER_JWT`
- [ ] `HOT_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_NEAR_NETWORK`
- [ ] `NEXT_PUBLIC_NEAR_RPC_URL`
- [ ] `NEXT_PUBLIC_CONTRACT_ID`
- [ ] `NEXT_PUBLIC_APP_URL` (update after first deploy!)
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional)

## 🎯 Post-Deployment

Once deployed successfully:

1. **Update README.md** with production URL
2. **Test E2E flow**:
   - Connect wallet
   - Create NOVA vault
   - Ask AI advisor
   - Verify TEE signature
   - Check contract on NearBlocks
3. **Monitor**:
   - Vercel Analytics (free)
   - Render logs for relayer
   - Database usage on Neon

## 🔗 URLs Summary

After deployment, you'll have:

- **Frontend**: `https://blindfold-[random].vercel.app`
- **Relayer**: `https://blindfold-relayer.onrender.com`
- **Contract**: `ecuador5.near` on NEAR mainnet
- **Database**: Neon PostgreSQL (already configured)

## 📝 Next Steps

1. Deploy to Vercel ⏳
2. Update AUTH_URL and APP_URL ⏳
3. Redeploy ⏳
4. Test E2E flow ⏳
5. (Optional) Add custom domain in Vercel settings

## ⚙️ Advanced: Custom Domain

To use your own domain (e.g., `blindfold.xyz`):

1. Go to Vercel Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed by Vercel
4. Update environment variables:
   - `AUTH_URL=https://blindfold.xyz`
   - `NEXT_PUBLIC_APP_URL=https://blindfold.xyz`
5. Redeploy

---

**Ready to deploy?** Go to https://vercel.com/new and follow the steps above! 🚀
