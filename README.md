# Device Validation API - POC

A proof-of-concept REST API that validates device IDs against the Audience Acuity identity graph to detect potential fraud.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Update `.env` with your configuration:

```bash
# API Key for your validation API (used by clients calling your API)
API_KEY=your-secret-api-key-change-this

# Audience Acuity API credentials (already configured)
AA_KEY_ID_DEV=your-dev-key
AA_SECRET_DEV=your-dev-secret
```

### 3. Start the server

```bash
# Development mode (with auto-reload)
npm run start:dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

Interactive API documentation is available at:

**http://localhost:3000/docs**

The documentation is powered by Scalar and provides:
- Full API specification
- Interactive request testing
- Example requests and responses
- Schema definitions

## Endpoints

### Health Check
```
GET /health
```
No authentication required. Returns server status.

### Validate Device
```
POST /v1/validate
```

**Headers:**
```
Content-Type: application/json
X-API-Key: your-secret-api-key-change-this
```

**Request Body:**
```json
{
  "device_id": "c925255d-3ab1-4e56-92cd-645ece08cdf9",
  "ip_address": "192.168.1.100",
  "session_timestamp": "2025-11-19T15:30:00Z"
}
```

**Response:**
```json
{
  "device_id": "c925255d-3ab1-4e56-92cd-645ece08cdf9",
  "validated": true,
  "confidence_score": 0.9,
  "signals": [
    "Device validated in National Consumer Database",
    "2 email(s) associated",
    "1 high-quality email(s)",
    "IP data available",
    "IP frequency: 179",
    "IP intensity: 7370",
    "IP strength: 1319230",
    "Confidence score (0.90) exceeds threshold (0.85)"
  ],
  "response_time_ms": 145
}
```

### Get Supported Templates
```
GET /v1/templates
```

**Headers:**
```
X-API-Key: your-secret-api-key-change-this
```

Returns list of supported scoring templates.

## Testing

### Using the Test Script

Test the API with sample device IDs from `/documentation/sample_device_ids.csv`:

```bash
# Test with first 5 devices (default)
node test-api.js

# Test with first 10 devices
node test-api.js --count 10

# Test all devices
node test-api.js --all

# Test a specific device ID
node test-api.js --device c925255d-3ab1-4e56-92cd-645ece08cdf9

# Show help
node test-api.js --help
```

### Using curl

```bash
curl -X POST http://localhost:3000/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-change-this" \
  -d '{
    "device_id": "60ff5214-92ec-4c54-b388-7ff01d97d69f",
    "ip_address": "192.168.1.100",
    "session_timestamp": "2025-11-19T15:30:00Z"
  }'
```

### Using the Documentation UI

1. Open `http://localhost:3000/docs` in your browser
2. Click on the `/v1/validate` endpoint
3. Click "Try it"
4. Add your API key in the authentication section
5. Modify the request body as needed
6. Click "Send"

## Architecture

### How It Works

```
Client Request
    ↓
[Your Validation API]
    ├─ Authenticate API Key
    ├─ Validate Request
    ├─ Call Audience Acuity API
    ├─ Calculate Confidence Score
    └─ Return Validation Result
```

### Confidence Scoring Algorithm

The scoring system is **configurable** and supports multiple algorithms based on template IDs.

#### Current Algorithm (Template: aadz_test_1 / 223323710)

**Base Scoring:**
- Device validated in National Consumer Database: **+0.7**
- Email data present: **+0.1**
- High-quality email (quality level ≥ 2): **+0.1**

**Placeholders for Future Enhancements:**
- IP frequency analysis
- IP intensity analysis
- IP strength analysis

**Validation Threshold:** 0.85

A device is marked as `validated: true` if the confidence score ≥ 0.85.

#### Adding New Scoring Algorithms

To add a new scoring algorithm:

1. Open `src/services/scoringService.ts`
2. Create a new algorithm object:
```typescript
const myNewAlgorithm: ScoringAlgorithm = {
  templateId: '123456789',
  templateName: 'my_template',
  calculate: (aaResponse: AAApiResponse): ScoringResult => {
    // Your scoring logic here
    return { confidence_score, validated, signals };
  }
};
```
3. Register it in the `ScoringService` constructor:
```typescript
this.algorithms.set(myNewAlgorithm.templateId, myNewAlgorithm);
```

## Project Structure

```
aadz/
├── src/
│   ├── server.ts              # Express server setup
│   ├── openapi.ts             # API specification for documentation
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── services/
│   │   ├── aaApiService.ts    # Audience Acuity API integration
│   │   └── scoringService.ts  # Confidence scoring algorithms
│   └── routes/
│       └── validation.ts      # Validation endpoint handlers
├── documentation/
│   ├── aadz-basicprd.md       # Product requirements document
│   ├── aa_api_templates.yaml  # AA API response templates
│   ├── sample_device_ids.csv  # Sample device IDs for testing
│   └── available_return_fields.json
├── test-api.js                # Test script for API validation
├── .env                       # Environment configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

### Required

- `API_KEY` - API key for authenticating requests to your validation API
- `AA_KEY_ID_DEV` - Audience Acuity API key ID (development)
- `AA_SECRET_DEV` - Audience Acuity API secret (development)
- `AA_KEY_ID_VERC` - Audience Acuity API key ID (Vercel/production)
- `AA_SECRET_VERC` - Audience Acuity API secret (Vercel/production)

### Optional

- `AA_ORIGIN` - AA API base URL (default: https://api.audienceacuity.com)
- `AA_TEMPLATE_ID` - Template ID to use (default: 223323710)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 3000)
- `INCLUDE_AA_RESPONSE` - Include raw AA response in dev mode (default: true)

## What This POC Demonstrates

### ✅ To Joint Venture Partners
- Working validation API built in TypeScript/Express
- Successfully integrates with Audience Acuity graph API
- Confidence scoring logic with clear, explainable signals
- Sub-200ms response times (when AA API is responsive)

### ✅ To DataZoom
- Production-ready endpoint at `/v1/validate`
- Interactive API documentation for easy testing
- Clear validation responses with confidence scores
- Ready for SDK integration

### ✅ Technical Validation
- Configurable scoring algorithms per template
- Proper error handling and status codes
- API key authentication
- Type-safe TypeScript implementation
- Extensible architecture for additional templates

## Next Steps

### For Production Deployment

1. **Add Vercel Configuration**
   - Create `vercel.json`
   - Configure serverless functions
   - Set environment variables in Vercel dashboard

2. **Add Redis Caching** (mentioned in PRD)
   - Cache device validation results for 24 hours
   - Reduce AA API calls for hot device IDs
   - Improve response times

3. **Add Rate Limiting**
   - Protect API from abuse
   - Configure per-API-key limits

4. **Add Monitoring**
   - Response time tracking
   - Error rate monitoring
   - AA API availability tracking

5. **Enhance Scoring Algorithms**
   - Implement IP frequency/intensity/strength scoring
   - Add more sophisticated fraud detection rules
   - A/B test different threshold values

## Troubleshooting

### AA API Returns 401 "API key is not active"

Check that the correct AA API credentials are configured in `.env`:
- For local development, ensure `AA_KEY_ID_DEV` and `AA_SECRET_DEV` are set
- Verify the keys are active in the AA dashboard
- Check that your IP is whitelisted (for dev keys)

### API Returns 401 "Unauthorized"

Ensure you're sending the `X-API-Key` header with the correct value from your `.env` file.

### Server Won't Start

1. Check that Node.js is installed: `node --version` (requires v18+)
2. Install dependencies: `npm install`
3. Verify `.env` file exists with required variables
4. Check that port 3000 is not already in use

## Support

For questions or issues, see:
- PRD: `/documentation/aadz-basicprd.md`
- AA API Templates: `/documentation/aa_api_templates.yaml`
- API Documentation: http://localhost:3000/docs (when server is running)
