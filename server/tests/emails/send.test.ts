import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.FRONTEND_URL = 'http://test.local';
});

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));
vi.mock('../../src/emails/client', async () => {
  return {
    resend: { emails: { send: mockSend } },
    EMAIL_FROM: 'noreply@test.local',
    EMAIL_FROM_NAME: 'Vision Test',
    FRONTEND_URL: 'http://test.local',
    formatFromAddress: () => 'Vision Test <noreply@test.local>',
  };
});

import { sendResetPasswordEmail, sendVerificationEmail } from '../../src/emails/send';

describe('sendResetPasswordEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
  });

  it('sends to the correct address with the reset URL', async () => {
    await sendResetPasswordEmail('user@test.local', 'plain-token-123', 'Alice');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.to).toBe('user@test.local');
    expect(callArg.subject).toMatch(/reset/i);
    expect(callArg.from).toBe('Vision Test <noreply@test.local>');
    expect(callArg.react).toBeDefined();
  });

  it('throws when Resend returns an error', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'API error' } });
    await expect(
      sendResetPasswordEmail('user@test.local', 'tok', 'Alice')
    ).rejects.toThrow(/API error/);
  });
});

describe('sendVerificationEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'msg-2' }, error: null });
  });

  it('sends to the correct address with the verify URL', async () => {
    await sendVerificationEmail('new@test.local', 'verify-token-abc', 'Bob');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.to).toBe('new@test.local');
    expect(callArg.subject).toMatch(/verify/i);
    expect(callArg.react).toBeDefined();
  });
});
