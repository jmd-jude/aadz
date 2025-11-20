# Vercel Deployment Guide

## Quick Deploy (5 minutes)

### 1. Install Vercel CLI (if not already installed globally)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### 3. Deploy

```bash
vercel
```

This will:
- Ask you to link to an existing project or create a new one
- Deploy your API
- Give you a deployment URL

### 4. Set Environment Variables

After the first deploy, you need to set your environment variables:

```bash
# Set production environment variables
vercel env add API_KEY
# When prompted, enter: your-secret-api-key-change-this

vercel env add AA_KEY_ID_VERC
# When prompted, enter: TIbUp6N2vHWOF4Qw

vercel env add AA_SECRET_VERC
# When prompted, enter: ZEYmrI37pJm3RQ1qgdIZT1B2JDKzuMJg

vercel env add AA_ORIGIN
# When prompted, enter: https://api.audienceacuity.com

vercel env add AA_TEMPLATE_ID
# When prompted, enter: 223323710
```

For each variable, select:
- Environment: **Production**
- Branch: **All branches** (or specific branches)

### 5. Redeploy with Environment Variables

```bash
vercel --prod
```

This deploys to production with your environment variables.

---

## Using the Vercel Dashboard (Alternative)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect the framework

### 3. Configure Environment Variables

In the Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each variable:

| Name | Value |
|------|-------|
| `API_KEY` | `6122f8a2cddd8dd54312244e9923d41f` |
| `AA_KEY_ID_VERC` | `TIbUp6N2vHWOF4Qw` |
| `AA_SECRET_VERC` | `ZEYmrI37pJm3RQ1qgdIZT1B2JDKzuMJg` |
| `AA_ORIGIN` | `https://api.audienceacuity.com` |
| `AA_TEMPLATE_ID` | `223323710` |

3. Click "Deploy" or push to your repo to trigger a new deployment

---

## Testing Your Deployment

Once deployed, you'll get a URL like: `https://your-project.vercel.app`

### Test the API

```bash
# Health check
curl https://your-project.vercel.app/health

# Validate endpoint
curl -X POST https://your-project.vercel.app/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-change-this" \
  -d '{
    "device_id": "c925255d-3ab1-4e56-92cd-645ece08cdf9",
    "ip_address": "192.168.1.100",
    "session_timestamp": "2025-11-19T15:30:00Z"
  }'
```

### View Documentation

Visit: `https://your-project.vercel.app/docs`

---

## Production Checklist

Before going live:

- [ ] Change `API_KEY` to a strong, unique value
- [ ] Verify AA credentials are the Vercel ones (not dev)
- [ ] Test all endpoints with production URL
- [ ] Update any client applications with the new URL
- [ ] Set up custom domain (optional)
- [ ] Enable Vercel Analytics (optional)

---

## Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS setup instructions
4. Wait for DNS propagation (5-30 minutes)

---

## Continuous Deployment

Vercel will automatically deploy when you push to your repository:

```bash
git add .
git commit -m "Update scoring algorithm"
git push
```

Vercel will:
1. Build your app
2. Run any tests
3. Deploy to production
4. Give you a unique URL for each deployment

---

## Monitoring

### View Logs

```bash
vercel logs
```

Or in the Vercel dashboard: Project → Deployments → Click a deployment → Logs

### View Analytics

Vercel dashboard → Project → Analytics

---

## Rollback

If something goes wrong:

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote DEPLOYMENT_URL
```

Or in the dashboard: Deployments → Click the 3 dots → Promote to Production

---

## Environment Variables Best Practices

### For Multiple Environments

You can have different values for:
- **Production** - your live API
- **Preview** - test deployments from branches
- **Development** - local development

Example:
```bash
# Production API key
vercel env add API_KEY production
# Enter: prod-secret-key-xyz

# Preview API key (for testing)
vercel env add API_KEY preview
# Enter: preview-test-key-123
```

---

## Troubleshooting

### "Module not found" errors

Make sure all dependencies are in `package.json`:
```bash
npm install
```

### API returns 500 errors

Check logs:
```bash
vercel logs --follow
```

Look for missing environment variables.

### Changes not showing

1. Force a new deployment:
```bash
vercel --prod --force
```

2. Or in dashboard: Deployments → Redeploy

### Timeout errors

Vercel has a 10-second timeout for serverless functions. If AA API is slow:
- Consider adding caching (Redis)
- Or use Vercel Pro for 60-second timeout

---

## Cost Considerations

**Vercel Free Tier includes:**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Edge network

**You'll need Pro if:**
- You exceed free tier limits
- You need longer function timeouts (>10s)
- You want team collaboration features

Current pricing: https://vercel.com/pricing

---

## Next Steps After Deployment

1. **Update OpenAPI spec** with your production URL:
   - Edit `src/openapi.ts`
   - Add your Vercel URL to the `servers` array

2. **Test with your test script**:
   ```bash
   API_URL=https://your-project.vercel.app \
   API_KEY=your-secret-api-key-change-this \
   node test-api.js --count 5
   ```

3. **Share with partners**:
   - Documentation: `https://your-project.vercel.app/docs`
   - Let them test the endpoint

4. **Monitor performance**:
   - Check response times
   - Monitor error rates
   - Adjust scoring algorithms as needed

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
- Your API docs: https://your-project.vercel.app/docs
