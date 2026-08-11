import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { Writable } from 'stream';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';

let mongo: MongoMemoryServer;
let app: import('express').Express;
let createLogger: typeof import('../../src/logger').createLogger;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = (await import('../../src/index')).app;
  createLogger = (await import('../../src/logger')).createLogger;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Capturing the logger's own destination rather than the process's output: a
// test that greps stdout pins the transport, and pinning the message text would
// break on every reword.
function capturingLogger() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _enc, cb) {
      lines.push(String(chunk));
      cb();
    },
  });
  const previousLevel = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = 'info';
  const log = createLogger(destination);
  process.env.LOG_LEVEL = previousLevel;
  return { log, lines };
}

describe('Liveness and readiness are separate questions', () => {
  it('reports liveness while the process is running', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('reports ready when the database is connected', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
  });

  it('reports unready when the database is disconnected', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unready');
    expect(res.body.database).toBe('disconnected');
  });

  it('keeps liveness healthy while the database is disconnected', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});

describe('The logger never becomes a credential store', () => {
  it('redacts passwords, tokens, cookies and authorization headers', () => {
    const { log, lines } = capturingLogger();

    log.info(
      {
        password: 'hunter2',
        newPassword: 'hunter3',
        token: 'a-real-token',
        req: {
          headers: {
            authorization: 'Bearer a-real-token',
            cookie: 'access_token=a-real-token',
          },
        },
      },
      'a request'
    );

    const output = lines.join('');
    expect(output).not.toContain('hunter2');
    expect(output).not.toContain('hunter3');
    expect(output).not.toContain('a-real-token');
    expect(output).toContain('[redacted]');
  });

  it('emits one parseable JSON object per event', () => {
    const { log, lines } = capturingLogger();

    log.info({ requestId: 'abc' }, 'something happened');

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.msg).toBe('something happened');
    expect(parsed.requestId).toBe('abc');
    expect(typeof parsed.time).toBe('string');
    expect(typeof parsed.level).toBe('number');
  });
});
