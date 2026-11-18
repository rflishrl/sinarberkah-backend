import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readBody, sameOriginRequest } from './api-helpers.js';

const { mockLogin, mockVerifyTurnstile, mockConsumeRateLimit, mockResetRateLimit } = vi.hoisted(
	() => ({
		mockLogin: vi.fn(),
		mockVerifyTurnstile: vi.fn(),
		mockConsumeRateLimit: vi.fn(),
		mockResetRateLimit: vi.fn()
	})
);

vi.mock('#lib/server/features/auth/service.js', () => ({
	login: mockLogin
}));

vi.mock('#lib/server/turnstile.js', () => ({
	verifyTurnstile: mockVerifyTurnstile
}));

vi.mock('#lib/server/api/rate-limit.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/api/rate-limit.js')>()),
	consumeRateLimit: mockConsumeRateLimit,
	resetRateLimit: mockResetRateLimit
}));

const { POST } = await import('../src/routes/api/auth/login/+server.js');

const admin = { email: 'admin@sinarberkah.com' };

const loginRequest = (json: unknown, headers?: Record<string, string>) =>
	sameOriginRequest('/api/auth/login', {
		method: 'POST',
		json,
		headers: { 'x-real-ip': '1.2.3.4', ...headers }
	});

beforeEach(() => {
	mockLogin.mockReset();
	mockVerifyTurnstile.mockReset().mockResolvedValue({ success: true, action: 'login' });
	mockConsumeRateLimit.mockReset().mockResolvedValue(undefined);
	mockResetRateLimit.mockReset().mockResolvedValue(undefined);
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/auth/login', () => {
	it('returns 200 for valid admin login and valid Turnstile verification', async () => {
		mockLogin.mockResolvedValue({
			result: { email: admin.email },
			setCookieHeader: 'admin_session=tok; Path=/'
		});
		const response = await POST({
			request: loginRequest({
				email: admin.email,
				password: 'secret-password',
				turnstileToken: 'valid-turnstile-token'
			})
		} as never);
		expect(response.status).toBe(200);
		expect(await readBody(response)).toEqual({
			success: true,
			data: { email: admin.email }
		});
		expect(mockVerifyTurnstile).toHaveBeenCalledWith('valid-turnstile-token', 'login', '1.2.3.4');
		expect(mockResetRateLimit).toHaveBeenCalledWith(expect.anything(), '1.2.3.4');
	});

	it('returns 422 if turnstileToken is missing or validation fails', async () => {
		const missing = await POST({
			request: loginRequest({ email: admin.email, password: 'secret-password' })
		} as never);
		expect(missing.status).toBe(422);
		expect(mockVerifyTurnstile).not.toHaveBeenCalled();

		mockVerifyTurnstile.mockResolvedValue({ success: false, reason: 'verification_rejected' });
		const invalid = await POST({
			request: loginRequest({
				email: admin.email,
				password: 'secret-password',
				turnstileToken: 'bad-token'
			})
		} as never);
		expect(invalid.status).toBe(422);
		expect(mockLogin).not.toHaveBeenCalled();
	});
});
