# Scoring Algorithm Guide

## Current Implementation

Location: `src/services/scoringService.ts` (lines 15-102)

### Current Scoring Formula

```
Base Score = 0.0

IF validated === true:          +0.7
IF has emails:                  +0.1
IF has quality emails (≥2):     +0.1

Max Score = 0.9 (before IP metrics)
Threshold = 0.85 (85%)
```

### Result: `validated = true` if score ≥ 0.85

---

## Understanding IP Metrics

From the AA API response, you get these IP metrics (lines 57-84):

- **frequency**: How often this IP appears (-39, 179, etc.)
- **intensity**: Signal strength (21, 7370, etc.)
- **strength**: Connection strength (-34, 1319230, etc.)

**Current status:** These are just REPORTED in the signals, not scored.

---

## How to Add IP Scoring

### Example 1: Simple Frequency Scoring

Replace line 62-67 with:

```typescript
if (ip.frequency !== undefined) {
  // Higher frequency = more legitimate
  if (ip.frequency > 100) {
    confidenceScore += 0.1;
    signals.push(`High IP frequency (${ip.frequency}) adds confidence`);
  } else if (ip.frequency > 0) {
    confidenceScore += 0.05;
    signals.push(`Moderate IP frequency (${ip.frequency})`);
  } else {
    signals.push(`Low/negative IP frequency (${ip.frequency})`);
  }
}
```

### Example 2: Intensity Threshold

Replace line 70-75 with:

```typescript
if (ip.intensity !== undefined) {
  // Intensity above threshold = legitimate
  if (ip.intensity > 1000) {
    confidenceScore += 0.1;
    signals.push(`Strong IP intensity (${ip.intensity})`);
  } else {
    signals.push(`Weak IP intensity (${ip.intensity})`);
  }
}
```

### Example 3: Combined IP Score

Replace the entire IP section (lines 57-84) with:

```typescript
// Combined IP metrics analysis
if (identity.ips && identity.ips.length > 0) {
  const ip = identity.ips[0];
  let ipScore = 0.0;

  // Frequency scoring (0-0.05 points)
  if (ip.frequency !== undefined && ip.frequency > 50) {
    ipScore += 0.05;
  }

  // Intensity scoring (0-0.05 points)
  if (ip.intensity !== undefined && ip.intensity > 500) {
    ipScore += 0.05;
  }

  // Strength scoring (0-0.05 points)
  if (ip.strength !== undefined && ip.strength > 10000) {
    ipScore += 0.05;
  }

  confidenceScore += ipScore;

  if (ipScore > 0) {
    signals.push(`IP metrics contributed ${(ipScore * 100).toFixed(0)}% confidence`);
  }
  signals.push(`IP: freq=${ip.frequency}, intensity=${ip.intensity}, strength=${ip.strength}`);
}
```

---

## Adjusting the Threshold

The threshold is on line 91. Current value: `0.85` (85%)

**To make validation stricter:**
```typescript
const validationThreshold = 0.95;  // Requires 95%
```

**To make validation more lenient:**
```typescript
const validationThreshold = 0.70;  // Only requires 70%
```

**To make it configurable via environment:**
```typescript
const validationThreshold = parseFloat(process.env.VALIDATION_THRESHOLD || '0.85');
```

---

## Understanding The Full AA Response

The AA API returns TONS of data. You can see all available fields in:
- `/documentation/available_return_fields.json` - All possible fields
- Current API response when you test (includes the `aa_response` object)

### Potentially Useful Fields to Score On

From `identity.data` object (if you want to add more signals):

```typescript
// Financial indicators
identity.data.creditRange         // "750 to 799"
identity.data.householdIncome     // "$100K to $149K"
identity.data.ownsInvestments     // true/false

// Demographic
identity.data.homeOwnership       // "Home Owner"
identity.data.lengthOfResidence   // 15 (years)
identity.data.education           // "Completed College"

// Behavioral
identity.data.petOwner           // true/false
identity.data.voter              // true/false
```

### Example: Adding Financial Scoring

```typescript
// After email checking, before IP metrics:
if (identity.data) {
  // High credit score adds confidence
  if (identity.data.creditMidpoint && identity.data.creditMidpoint >= 700) {
    confidenceScore += 0.05;
    signals.push(`Strong credit score (${identity.data.creditMidpoint})`);
  }

  // Home ownership adds confidence
  if (identity.data.homeOwnership === 'Home Owner') {
    confidenceScore += 0.05;
    signals.push('Verified home owner');
  }
}
```

---

## Testing Your Changes

1. **Edit** `src/services/scoringService.ts`
2. **Server auto-reloads** (tsx watch is running)
3. **Test** with:
   ```bash
   # Single device
   curl -X POST http://localhost:3000/v1/validate \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-secret-api-key-change-this" \
     -d '{"device_id":"60ff5214-92ec-4c54-b388-7ff01d97d69f","ip_address":"192.168.1.100","session_timestamp":"2025-11-19T15:30:00Z"}'

   # Multiple devices
   node test-api.js --count 10
   ```

4. **Watch the signals** - they tell you what's being scored!

---

## Creating Multiple Algorithms

You can create different algorithms for different use cases:

```typescript
// In scoringService.ts, after aadzTest1Algorithm:

const strictFraudDetection: ScoringAlgorithm = {
  templateId: '223323710',
  templateName: 'strict_fraud',
  calculate: (aaResponse: AAApiResponse): ScoringResult => {
    // Very strict scoring
    let confidenceScore = 0.0;
    const signals: string[] = [];

    if (!aaResponse.identities?.[0]?.validated) {
      return { confidence_score: 0, validated: false, signals: ['Not in database'] };
    }

    // Must have high-quality email
    const hasQualityEmail = aaResponse.identities[0].emails?.some(
      e => (e.qualityLevel || 0) >= 2
    );
    if (!hasQualityEmail) {
      return { confidence_score: 0.3, validated: false, signals: ['No quality email'] };
    }

    confidenceScore = 1.0;
    signals.push('Passed strict validation');

    return { confidence_score: confidenceScore, validated: true, signals };
  }
};

// Then register it:
// In the ScoringService constructor, add:
this.algorithms.set(strictFraudDetection.templateId, strictFraudDetection);
```

---

## Quick Experiments to Try

### 1. See what fields are actually populated
Look at the `aa_response` in your test results to see what data you're getting.

### 2. Lower the threshold temporarily
Change line 91 to `const validationThreshold = 0.60;` and see how many more devices validate.

### 3. Add phone number scoring
```typescript
if (identity.phones && identity.phones.length > 0) {
  confidenceScore += 0.05;
  signals.push(`${identity.phones.length} phone number(s) on file`);
}
```

### 4. Check device age
```typescript
if (identity.devices && identity.devices[0]?.addedDate) {
  const addedDate = new Date(identity.devices[0].addedDate);
  const ageInDays = (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays > 365) {
    confidenceScore += 0.05;
    signals.push(`Device known for ${Math.round(ageInDays)} days`);
  }
}
```

---

## Best Practices

1. **Start conservative** - Don't add too many points too quickly
2. **Test with real data** - Use `node test-api.js --all` to see distribution
3. **Watch the signals** - They help you understand WHY devices scored the way they did
4. **Document your logic** - Add comments explaining the "why" behind scores
5. **Version your algorithms** - Keep old ones around for A/B testing

---

## Next Steps

1. Run `node test-api.js --all` to see current results across all 50 devices
2. Look at the patterns - which devices validate? Which don't?
3. Experiment with adding IP scoring
4. Adjust the threshold based on your desired fraud tolerance

The file to edit: `src/services/scoringService.ts` (lines 15-102)
