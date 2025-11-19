# 🚀 Quick Deploy to Vercel

## Option 1: Command Line (Fastest)

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy (preview)
npm run deploy

# 3. Set environment variables
npx vercel env add API_KEY
# Enter: your-secret-api-key-change-this

npx vercel env add AA_KEY_ID_VERC
# Enter: TIbUp6N2vHWOF4Qw

npx vercel env add AA_SECRET_VERC
# Enter: ZEYmrI37pJm3RQ1qgdIZT1B2JDKzuMJg

npx vercel env add AA_ORIGIN
# Enter: https://api.audienceacuity.com

npx vercel env add AA_TEMPLATE_ID
# Enter: 223323710

# 4. Deploy to production
npm run deploy:prod
```

Done! Your API is live at `https://your-project.vercel.app`

---

## Option 2: GitHub + Vercel Dashboard

```bash
# 1. Create GitHub repo and push
git init
git add .
git commit -m "Device validation API"
git remote add origin YOUR_REPO_URL
git push -u origin main

# 2. Go to vercel.com and import your GitHub repo
# 3. Add environment variables in Vercel dashboard
# 4. Deploy!
```

---

## Test Your Deployment

```bash
curl https://your-project.vercel.app/health
```

View docs: `https://your-project.vercel.app/docs`

---

## What Gets Deployed

✅ API endpoints (`/v1/validate`, `/v1/templates`)
✅ Interactive documentation (`/docs`)
✅ Health check (`/health`)
✅ Automatic HTTPS
✅ Global CDN
✅ Environment variables (secure)

---

## Files Created for Deployment

- `vercel.json` - Vercel configuration
- `api/index.ts` - Serverless function entry point
- `VERCEL_DEPLOYMENT.md` - Full deployment guide

---

See **VERCEL_DEPLOYMENT.md** for detailed instructions, troubleshooting, and advanced configuration.
