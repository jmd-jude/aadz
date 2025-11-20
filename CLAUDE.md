# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Device Validation API - A TypeScript/Express REST API that validates device IDs against the Audience Acuity (AA) identity graph API to detect fraud. This is a proof-of-concept deployed on Vercel.

## Development Commands

### Start Development Server
```bash
npm run start:dev  # Development with auto-reload (tsx watch)
npm start          # Production mode (tsx)
```

### Testing
```bash
# Test with sample device IDs from documentation/sample_device_ids.csv
node test-api.js              # First 5 devices
node test-api.js --count 10   # First 10 devices
node test-api.js --all        # All devices
node test-api.js --device <uuid>  # Specific device
```

### Deployment
```bash
npm run deploy       # Deploy to Vercel preview
npm run deploy:prod  # Deploy to Vercel production
```

### Access API Documentation
When server is running: http://localhost:3000/docs

## Architecture Overview

### Request Flow
```
Client → Validation API → AA Graph API → Scoring Service → Response
```

1. **Authentication**: `X-API-Key` header checked in `server.ts` middleware
2. **Validation Route** (`routes/validation.ts`): Receives POST to `/v1/validate`
3. **AA API Service** (`services/aaApiService.ts`): Calls Audience Acuity `/v2/identities/byDevice` endpoint
4. **Scoring Service** (`services/scoringService.ts`): Applies template-specific scoring algorithm
5. **Response**: Returns `validated` boolean, `confidence_score`, and `signals` array

### Service Layer Architecture

**AudienceAcuityService** (`services/aaApiService.ts`)
- Handles communication with AA API
- Authentication: MD5 hash of `{timestamp}{secret}`, formatted as `{keyId}{timestamp}{hash}`
- Uses GET request with query params (not POST)
- Environment-aware: uses `_DEV` credentials locally, `_VERC` credentials in production

**ScoringService** (`services/scoringService.ts`)
- **Multi-algorithm design**: Maps `templateId` → scoring algorithm
- Current algorithm: `aadz_test_1` (template ID `223323710`)
- **Extensible**: Add new algorithms by creating a `ScoringAlgorithm` object and registering in constructor
- Each algorithm returns: `{ confidence_score, validated, signals }`

### Current Scoring Algorithm (aadz_test_1)

Base scoring:
- Device validated in National Consumer Database: +0.7
- Emails present: +0.1
- High-quality emails (quality level ≥ 2): +0.1

Validation threshold: **0.85** (device marked validated if score ≥ 0.85)

IP metrics (frequency, intensity, strength) are captured in signals but **not yet scored** - placeholders exist for future implementation.

### Deployment Architecture

**Local Development**:
- `server.ts` runs Express directly on port 3000
- Uses `AA_KEY_ID_DEV` and `AA_SECRET_DEV`

**Vercel Production**:
- `api/index.ts` exports Express app as serverless function
- `vercel.json` routes all requests to `/api/index.ts`
- Uses `AA_KEY_ID_VERC` and `AA_SECRET_VERC`

## Environment Variables

Required in `.env`:
- `API_KEY` - Authentication for clients calling this API
- `AA_KEY_ID_DEV` / `AA_SECRET_DEV` - AA API credentials for local development
- `AA_KEY_ID_VERC` / `AA_SECRET_VERC` - AA API credentials for Vercel (whitelisted for dynamic IPs)

Optional:
- `AA_ORIGIN` - AA API base URL (default: https://api.audienceacuity.com)
- `AA_TEMPLATE_ID` - Template ID for AA API (default: 223323710)
- `NODE_ENV` - Set to 'production' in Vercel
- `PORT` - Server port (default: 3000)
- `INCLUDE_AA_RESPONSE` - Include raw AA response in dev mode (default: true)

## Adding a New Scoring Algorithm

1. Open `src/services/scoringService.ts`
2. Create algorithm object implementing `ScoringAlgorithm` interface:
```typescript
const myNewAlgorithm: ScoringAlgorithm = {
  templateId: 'your_template_id',
  templateName: 'descriptive_name',
  calculate: (aaResponse: AAApiResponse): ScoringResult => {
    // Your scoring logic
    return { confidence_score, validated, signals };
  }
};
```
3. Register in `ScoringService` constructor:
```typescript
this.algorithms.set(myNewAlgorithm.templateId, myNewAlgorithm);
```
4. Set `AA_TEMPLATE_ID` environment variable to use the new template

## TypeScript Configuration

- Module system: ESM (`"type": "module"` in package.json, `.js` imports required)
- Strict mode enabled
- Uses `tsx` for running TypeScript directly (no build step for development)

## Key API Endpoints

- `GET /health` - No auth required
- `POST /v1/validate` - Requires `X-API-Key` header
- `GET /v1/templates` - Requires `X-API-Key` header, returns supported templates
- `GET /docs` - Interactive Scalar documentation

## Common Issues

**AA API 401 "API key is not active"**
- Verify correct credentials are in `.env` (check `_DEV` vs `_VERC`)
- Ensure IP is whitelisted for dev keys
- Check credentials are active in AA dashboard

**Vercel deployment issues**
- Ensure environment variables are set in Vercel dashboard
- Use `AA_KEY_ID_VERC`/`AA_SECRET_VERC` credentials with wildcard IP whitelist
- Check `api/index.ts` exports the Express app correctly
