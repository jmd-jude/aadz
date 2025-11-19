import express, { type Request, type Response, Router } from 'express';
import { createAAService } from '../services/aaApiService.js';
import { ScoringService } from '../services/scoringService.js';
import type { ValidationRequest, ValidationResponse } from '../types/index.js';

const router: Router = express.Router();
const scoringService = new ScoringService();

// Validation endpoint
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    // Validate request body
    const { device_id, ip_address, session_timestamp } = req.body as Partial<ValidationRequest>;

    if (!device_id) {
      res.status(400).json({ error: 'Missing required field: device_id' });
      return;
    }

    if (!ip_address) {
      res.status(400).json({ error: 'Missing required field: ip_address' });
      return;
    }

    if (!session_timestamp) {
      res.status(400).json({ error: 'Missing required field: session_timestamp' });
      return;
    }

    // Validate session_timestamp is valid ISO 8601
    const timestamp = new Date(session_timestamp);
    if (isNaN(timestamp.getTime())) {
      res.status(400).json({ error: 'Invalid session_timestamp format. Must be ISO 8601.' });
      return;
    }

    // Call AA API
    const aaService = createAAService();
    const templateId = process.env.AA_TEMPLATE_ID || '223323710';

    let aaResponse;
    try {
      aaResponse = await aaService.getDeviceIdentity(device_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(502).json({
        error: 'Failed to validate device',
        message: errorMessage,
        device_id
      });
      return;
    }

    // Calculate confidence score
    const scoringResult = scoringService.calculateScore(aaResponse, templateId);

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Build response
    const response: ValidationResponse = {
      device_id,
      validated: scoringResult.validated,
      confidence_score: parseFloat(scoringResult.confidence_score.toFixed(3)),
      signals: scoringResult.signals,
      response_time_ms: responseTime
    };

    // Optionally include raw AA response in development
    if (process.env.NODE_ENV !== 'production' && process.env.INCLUDE_AA_RESPONSE === 'true') {
      response.aa_response = aaResponse;
    }

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const responseTime = Date.now() - startTime;

    console.error('Validation error:', error);

    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
      response_time_ms: responseTime
    });
  }
});

// Get supported scoring templates (useful for debugging)
router.get('/templates', (req: Request, res: Response): void => {
  const templates = scoringService.getSupportedTemplates();
  res.json({
    supported_templates: templates,
    current_template: process.env.AA_TEMPLATE_ID || '223323710'
  });
});

export default router;
