import pinoHttp from 'pino-http';
import type { Logger } from '../logger';

// Probes run every few seconds; logging them would make the health check the
// bulk of the log.
const isHealthPath = (url = ''): boolean => url.startsWith('/api/health');

// One line per request, on completion. Two lines — one on start, one on end —
// doubles the volume to record something the completion line already implies.
export const httpLogger = (log: Logger) =>
  pinoHttp({
    logger: log,
    autoLogging: { ignore: (req) => isHealthPath(req.url) },
    genReqId: (req) => (req as { id?: string }).id ?? '',
    customProps: (req) => ({ requestId: (req as { id?: string }).id }),
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ status: res.statusCode }),
    },
  });
