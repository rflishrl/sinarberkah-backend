import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyTurnstile } from '#lib/server/turnstile.js';

const fetchMock = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock);
	vi.stubEnv('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA');
	vi.stubEnv('TURNSTILE_ALLOWED_HOSTNAMES', 'localhost,127.0.0.1,example.com');
	fetchMock.mockReset();
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe('verifyTurnstile: fail-closed checks', () => {
	it('rejects empty tokens and missing server configuration', async () => {
		expect((await verifyTurnstile(undefined, 'login')).reason).toBe('empty_token');
		expect((await verifyTurnstile('   ', 'login')).reason).toBe('empty_token');

		vi.stubEnv('TURNSTILE_SECRET_KEY', '');
		expect((await verifyTurnstile('token123', 'login')).reason).toBe('missing_secret_key');

		vi.stubEnv('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA');
		vi.stubEnv('TURNSTILE_ALLOWED_HOSTNAMES', '');
		expect((await verifyTurnstile('token123', 'login')).reason).toBe('missing_allowed_hostnames');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('validates success, action, hostname, network timeout, and HTTP errors', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ success: true, action: 'login', hostname: 'localhost' }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
		const ok = await verifyTurnstile('valid-token', 'login', '1.2.3.4');
		expect(ok).toEqual({ success: true, hostname: 'localhost', action: 'login' });

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ success: true, action: 'register', hostname: 'localhost' }), {
				status: 200
			})
		);
		expect((await verifyTurnstile('tok', 'login')).reason).toBe('action_mismatch');

		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ success: true, action: 'login', hostname: 'attacker.com' }), {
				status: 200
			})
		);
		expect((await verifyTurnstile('tok', 'login')).reason).toBe('hostname_mismatch');

		fetchMock.mockRejectedValueOnce(new Error('timeout'));
		expect((await verifyTurnstile('tok', 'login')).reason).toBe('timeout_or_network_error');

		fetchMock.mockResolvedValueOnce(new Response('err', { status: 500 }));
		expect((await verifyTurnstile('tok', 'login')).reason).toBe('http_error');
	});
});
