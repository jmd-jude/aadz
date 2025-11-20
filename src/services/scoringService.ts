import type { AAApiResponse, ScoringAlgorithm, ScoringResult } from '../types/index.js';

/**
 * Scoring algorithm for template: aadz_test_1 (223323710)
 *
 * Current implementation:
 * - If validated=true in AA response, device is verified
 * - Base confidence score of 0.7 for validated devices
 *
 * Placeholders for future enhancements:
 * - IP frequency, intensity, strength metrics
 * - Email quality level
 * - Additional signals
 */
const aadzTest1Algorithm: ScoringAlgorithm = {
  templateId: '223323710',
  templateName: 'aadz_test_1',
  calculate: (aaResponse: AAApiResponse): ScoringResult => {
    const signals: string[] = [];
    let confidenceScore = 0.0;
    let validated = false;

    // Check if we have any identities
    if (!aaResponse.identities || aaResponse.identities.length === 0) {
      signals.push('No identity data found');
      return { confidence_score: confidenceScore, validated, signals };
    }

    const identity = aaResponse.identities[0];
    if (!identity) {
      signals.push('No identity data found');
      return { confidence_score: confidenceScore, validated, signals };
    }

    // Primary validation: Check if device is validated in National Consumer Database
    if (identity.validated === true) {
      confidenceScore += 0.7;
      signals.push('Device validated in National Consumer Database');
      validated = true;
    } else {
      signals.push('Device not found in National Consumer Database');
    }

    // Check for email data
    if (identity.emails && identity.emails.length > 0) {
      confidenceScore += 0.1;
      signals.push(`${identity.emails.length} email(s) associated`);

      // Check email quality
      const highQualityEmails = identity.emails.filter(
        (email) => (email.qualityLevel || 0) >= 2
      );
      if (highQualityEmails.length > 0) {
        confidenceScore += 0.1;
        signals.push(`${highQualityEmails.length} high-quality email(s)`);
      }
    }

    // PLACEHOLDER: IP metrics analysis
    // Future enhancement: analyze frequency, intensity, strength
    if (identity.ips && identity.ips.length > 0) {
      const ip = identity.ips[0];
      if (!ip) {
        signals.push('IP data unavailable');
      } else {
        signals.push('IP data available');

        // Placeholder for frequency analysis
        if (ip.frequency !== undefined) {
          // TODO: Implement frequency-based scoring
          // Example: Higher frequency might indicate legitimate regular usage
          // confidenceScore += calculateFrequencyScore(ip.frequency);
          signals.push(`IP frequency: ${ip.frequency}`);
        }

        // Placeholder for intensity analysis
        if (ip.intensity !== undefined) {
          // TODO: Implement intensity-based scoring
          // Example: Intensity patterns could indicate fraud or legitimacy
          // confidenceScore += calculateIntensityScore(ip.intensity);
          signals.push(`IP intensity: ${ip.intensity}`);
        }

        // Placeholder for strength analysis
        if (ip.strength !== undefined) {
          // TODO: Implement strength-based scoring
          // Example: Stronger IP connections might increase confidence
          // confidenceScore += calculateStrengthScore(ip.strength);
          signals.push(`IP strength: ${ip.strength}`);
        }
      }
    }

    // Cap confidence score at 1.0
    confidenceScore = Math.min(confidenceScore, 1.0);

    // Determine final validation
    // Currently using 0.85 threshold, but this could be configurable
    const validationThreshold = 0.85;
    validated = confidenceScore >= validationThreshold;

    if (validated) {
      signals.push(`Confidence score (${confidenceScore.toFixed(2)}) exceeds threshold (${validationThreshold})`);
    } else {
      signals.push(`Confidence score (${confidenceScore.toFixed(2)}) below threshold (${validationThreshold})`);
    }

    return { confidence_score: confidenceScore, validated, signals };
  }
};

/**
 * Scoring service that routes to the appropriate algorithm based on template
 */
export class ScoringService {
  private algorithms: Map<string, ScoringAlgorithm>;

  constructor() {
    this.algorithms = new Map();

    // Register available algorithms
    this.algorithms.set(aadzTest1Algorithm.templateId, aadzTest1Algorithm);
  }

  /**
   * Calculate confidence score for a given AA API response
   */
  calculateScore(aaResponse: AAApiResponse, templateId: string): ScoringResult {
    const algorithm = this.algorithms.get(templateId);

    if (!algorithm) {
      // Fallback to basic validation if template not found
      console.warn(`No scoring algorithm found for template ${templateId}, using basic validation`);
      return this.basicValidation(aaResponse);
    }

    return algorithm.calculate(aaResponse);
  }

  /**
   * Basic fallback validation
   */
  private basicValidation(aaResponse: AAApiResponse): ScoringResult {
    const validated =
      aaResponse.identities &&
      aaResponse.identities.length > 0 &&
      aaResponse.identities[0]?.validated === true;

    return {
      confidence_score: validated ? 0.7 : 0.2,
      validated,
      signals: [validated ? 'Device validated (basic)' : 'Device not validated (basic)']
    };
  }

  /**
   * Get list of supported template IDs
   */
  getSupportedTemplates(): string[] {
    return Array.from(this.algorithms.keys());
  }

  /**
   * Add a new scoring algorithm
   */
  registerAlgorithm(algorithm: ScoringAlgorithm): void {
    this.algorithms.set(algorithm.templateId, algorithm);
  }
}
