import mongoose from 'mongoose';
import { logger } from '../logger';

const MAX_ATTEMPTS = Number(process.env.MONGODB_CONNECT_ATTEMPTS) || 8;
const BASE_DELAY_MS = Number(process.env.MONGODB_CONNECT_BASE_DELAY_MS) || 500;
const MAX_DELAY_MS = 10_000;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// A database that starts a few seconds after the server should not take the
// service down. Exiting on the first failed attempt made a recoverable ordering
// problem into an outage.
const connectDB = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI!);
      logger.info({ host: conn.connection.host }, 'MongoDB connected');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === MAX_ATTEMPTS) {
        logger.fatal(
          { attempt, error: message },
          'MongoDB connection failed, giving up'
        );
        process.exit(1);
      }
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
      logger.warn(
        { attempt, retryInMs: delay, error: message },
        'MongoDB connection failed, retrying'
      );
      await wait(delay);
    }
  }
};

export const isDatabaseConnected = (): boolean =>
  mongoose.connection.readyState === 1;

export default connectDB;
