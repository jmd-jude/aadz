import type { AAApiResponse, ApiConfig } from '../types/index.js';

export class AudienceAcuityService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  async getDeviceIdentity(deviceId: string): Promise<AAApiResponse> {
    // Build URL with query parameters (GET request, not POST!)
    // Note: API uses 'device' and 'template' (not 'deviceId' and 'templateId')
    const params = new URLSearchParams({
      device: deviceId,
      template: this.config.templateId
    });
    const url = `${this.config.aaOrigin}/v2/identities/byDevice?${params}`;

    // Create AA custom authentication header
    const timestamp = Date.now().toString();
    const toHash = timestamp + this.config.aaSecret;

    // Create MD5 hash
    const crypto = await import('crypto');
    const hash = crypto.createHash('md5').update(toHash).digest('hex');

    // Format: {keyId}{timestamp}{hash}
    const authHeader = `${this.config.aaKeyId}${timestamp}${hash}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `AA API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json() as AAApiResponse;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to call AA API: ${error.message}`);
      }
      throw new Error('Failed to call AA API: Unknown error');
    }
  }
}

// Create and export a configured instance
export function createAAService(): AudienceAcuityService {
  const isProduction = process.env.NODE_ENV === 'production';

  const config: ApiConfig = {
    aaKeyId: isProduction
      ? process.env.AA_KEY_ID_VERC || ''
      : process.env.AA_KEY_ID_DEV || '',
    aaSecret: isProduction
      ? process.env.AA_SECRET_VERC || ''
      : process.env.AA_SECRET_DEV || '',
    aaOrigin: process.env.AA_ORIGIN || 'https://api.audienceacuity.com',
    templateId: process.env.AA_TEMPLATE_ID || '223323710'
  };

  // Validate configuration
  if (!config.aaKeyId || !config.aaSecret) {
    throw new Error('AA API credentials not configured');
  }

  return new AudienceAcuityService(config);
}
