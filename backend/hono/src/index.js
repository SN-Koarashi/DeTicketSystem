// @ts-nocheck
import { Hono } from 'hono';
import routes from './routes/index.js';

const app = new Hono();

app.use('/*', async (c, next) => {
  c.set('db', c.env.DB);

  await next();
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'API',
    version: '1.0.0',
    status: 'running',
    metadata: process.env.NODE_ENV
  });
});

// Register all routes
app.route('/', routes);

// 404 handler
app.notFound((c) => {
  return c.json({
    message: 'Not Found'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    message: '伺服器發生錯誤',
    error: err.message
  }, 500);
});

export default app;
