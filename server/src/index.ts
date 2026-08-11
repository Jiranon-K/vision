import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB, { isDatabaseConnected } from './config/db';
import { generalLimiter } from './config/rateLimit';
import { assertStoreIsUsable } from './config/rateLimitStore';
import { logger } from './logger';
import { requestId } from './middleware/requestId';
import { httpLogger } from './middleware/httpLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import postsRoutes from './routes/posts';
import analyticsRoutes from './routes/analytics';
import settingsRoutes from './routes/settings';
import capabilitiesRoutes from './routes/capabilities';

export const app = express();
const PORT = process.env.PORT || 3001;

// Nothing here serves HTML, so the interesting policy is the frontend's. What
// this buys is the cheap, universally correct half: no MIME sniffing, no
// framing, a referrer policy, and no framework name for a scanner to read.
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(requestId);
app.use(httpLogger(logger));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());


app.use('/api', generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/capabilities', capabilitiesRoutes);

// Liveness: the process is up. Deliberately says nothing about the database —
// blending the two makes an orchestrator restart healthy processes in a loop
// during a database outage, turning a dependency failure into an outage.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness: this server can actually serve. The old check answered "healthy"
// as long as the process was running, which is exactly the situation where it
// is least informative.
app.get('/api/health/ready', (_req, res) => {
  const connected = isDatabaseConnected();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ready' : 'unready',
    database: connected ? 'connected' : 'disconnected',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  // Fail at deploy time rather than at the first incident: a production server
  // with no shared rate limit store enforces nothing above one instance.
  assertStoreIsUsable();

  // Connect first, then listen. Listening before the database is reachable
  // leaves a window in which the server accepts requests it cannot answer.
  void connectDB().then(() => {
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server listening');
    });
  });
}

export default app;
