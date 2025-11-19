import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import { apiReference } from '@scalar/express-api-reference';
import validationRouter from '../src/routes/validation.js';
import { openApiSpec } from '../src/openapi.js';

dotenv.config();

const app: Express = express();

// Middleware
app.use(express.json());

// API Key Authentication Middleware
const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    res.status(500).json({ error: 'Server configuration error: API_KEY not set' });
    return;
  }

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }

  next();
};

// API Documentation (no auth required)
app.use(
  '/docs',
  apiReference({
    spec: {
      content: openApiSpec
    },
    theme: 'purple',
    darkMode: true
  })
);

// Health check endpoint (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply authentication to all /v1/* routes
app.use('/v1', authenticateApiKey, validationRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Export for Vercel
export default app;
