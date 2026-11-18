import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '#lib/server/api/errors.js';
import { RATE_LIMITS } from '#lib/server/api/rate-limits.js';
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
	it('returns 200 for valid admin login and resets IP+email rate limit', async () => {
		mockLogin.mockResolvedValue({
			result: { email: admin.email },
			setCookieHeader: 'admin_session=tok; Path=/'
		});
		const response = await POST({
			request: loginRequest({
				email: admin.email,
				password: 'secret-password',
				turnstileToken: 'valid-turnstile-token'
			}),
			getClientAddress: () => '9.9.9.9'
		} as never);
		expect(response.status).toBe(200);
		expect(await readBody(response)).toEqual({
			success: true,
			data: { email: admin.email }
		});
		expect(mockConsumeRateLimit).toHaveBeenCalledWith(
			RATE_LIMITS.login,
			`9.9.9.9:${admin.email}`,
			expect.any(String)
		);
		expect(mockVerifyTurnstile).toHaveBeenCalledWith('valid-turnstile-token', 'login', '9.9.9.9');
		expect(mockResetRateLimit).toHaveBeenCalledWith(RATE_LIMITS.login, `9.9.9.9:${admin.email}`);
	});

	it('returns silent fake success when honeypot website field is filled without calling rate limiter, Turnstile, or login', async () => {
		const response = await POST({
			request: loginRequest({
				email: admin.email,
				password: 'secret-password',
				turnstileToken: 'valid-turnstile-token',
				website: 'https://spam-bot.example'
			})
		} as never);

		expect(response.status).toBe(200);
		expect(await readBody(response)).toEqual({
			success: true,
			data: { email: admin.email }
		});
		expect(mockConsumeRateLimit).not.toHaveBeenCalled();
		expect(mockVerifyTurnstile).not.toHaveBeenCalled();
		expect(mockLogin).not.toHaveBeenCalled();
	});

	it('returns 429 with Retry-After before calling Turnstile or password auth when rate limited', async () => {
		mockConsumeRateLimit.mockRejectedValueOnce(
			new AppError('RATE_LIMITED', 'Terlalu banyak percobaan. Coba lagi dalam 2 menit.', {
				retryAfterSeconds: 120
			})
		);

		const response = await POST({
			request: loginRequest({
				email: admin.email,
				password: 'secret-password',
				turnstileToken: 'valid-turnstile-token'
			}),
			getClientAddress: () => '1.2.3.4'
		} as never);

		expect(response.status).toBe(429);
		expect(response.headers.get('retry-after')).toBe('120');
		expect(await readBody(response)).toEqual({
			success: false,
			error: 'Terlalu banyak percobaan. Coba lagi dalam 2 menit.'
		});
		expect(mockVerifyTurnstile).not.toHaveBeenCalled();
		expect(mockLogin).not.toHaveBeenCalled();
	});

	it('returns 422 if Zod 4 validation fails, turnstileToken is missing, or Turnstile verification fails', async () => {
		const badEmail = await POST({
			request: loginRequest({
				email: 'bukan-email-valid',
				password: 'secret-password',
				turnstileToken: 'valid-turnstile-token'
			})
		} as never);
		expect(badEmail.status).toBe(422);
		expect(mockVerifyTurnstile).not.toHaveBeenCalled();
		expect(mockLogin).not.toHaveBeenCalled();

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
