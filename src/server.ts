import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';
import validationRouter from './routes/validation.js';
import { openApiSpec } from './openapi.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
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

// Root path - redirect to documentation
app.get('/', (req: Request, res: Response) => {
  res.redirect('/docs');
});

// API Documentation (no auth required)
app.use(
  '/docs',
  apiReference({
    spec: {
      content: openApiSpec as any
    },
    theme: 'purple',
    darkMode: true
  } as any)
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

app.listen(PORT, () => {
  console.log('\n🚀 Device Validation API Server Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log('\n📚 API Documentation:');
  console.log(`   http://localhost:${PORT}/docs`);
  console.log('\n🔍 Endpoints:');
  console.log(`   Health:     http://localhost:${PORT}/health`);
  console.log(`   Validate:   http://localhost:${PORT}/v1/validate`);
  console.log(`   Templates:  http://localhost:${PORT}/v1/templates`);
  console.log('\n🔑 API Key: Set in X-API-Key header');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

export default app;
