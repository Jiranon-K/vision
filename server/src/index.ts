import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import { generalLimiter } from './config/rateLimit';
import { requestId } from './middleware/requestId';
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectDB();
  });
}

export default app;
