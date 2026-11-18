import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUserByEmail = vi.fn();
const setSessionCookie = vi.fn().mockReturnValue('admin_session=tok; Path=/');
const clearSessionCookie = vi.fn().mockReturnValue('admin_session=; Max-Age=0');

vi.mock('#lib/server/features/auth/repository.js', () => ({
	findUserByEmail: (...args: unknown[]) => findUserByEmail(...args)
}));

vi.mock('#lib/server/auth/session.js', () => ({
	setSessionCookie: (...args: unknown[]) => setSessionCookie(...args),
	clearSessionCookie: (...args: unknown[]) => clearSessionCookie(...args)
}));

import { hashPassword } from '#lib/server/auth/password.js';

const { login, logout } = await import('#lib/server/features/auth/service.js');

const adminPassword = 'secret-password';
const validToken = 'sample-turnstile-token';
const admin = {
	id: 'a1',
	email: 'admin@sinarberkah.com',
	password_hash: hashPassword(adminPassword),
	role: 'admin'
};

const user = {
	id: 'u1',
	email: 'user@sinarberkah.com',
	password_hash: hashPassword(adminPassword),
	role: 'user'
};

beforeEach(() => {
	findUserByEmail.mockReset();
	setSessionCookie.mockClear();
	clearSessionCookie.mockClear();
});

describe('login: validation', () => {
	it('rejects invalid email, empty password, and missing turnstileToken', async () => {
		await expect(
			login({ email: 'not-an-email', password: 'x', turnstileToken: validToken })
		).rejects.toMatchObject({ name: 'ZodError' });
		expect(findUserByEmail).not.toHaveBeenCalled();

		await expect(
			login({ email: 'admin@sinarberkah.com', password: '', turnstileToken: validToken })
		).rejects.toMatchObject({ name: 'ZodError' });

		await expect(
			login({ email: 'admin@sinarberkah.com', password: adminPassword, turnstileToken: '' })
		).rejects.toMatchObject({ name: 'ZodError' });
	});

	it('normalizes email whitespace and casing', async () => {
		findUserByEmail.mockResolvedValue(admin);
		await login({
			email: '  Admin@SinarBerkah.COM ',
			password: adminPassword,
			turnstileToken: validToken
		});
		expect(findUserByEmail).toHaveBeenCalledWith('admin@sinarberkah.com');
	});
});

describe('login: authorization', () => {
	it('succeeds with valid admin credentials and sets session cookie', async () => {
		findUserByEmail.mockResolvedValue(admin);
		const res = await login({
			email: admin.email,
			password: adminPassword,
			turnstileToken: validToken
		});
		expect(res.result).toEqual({ email: admin.email });
		expect(setSessionCookie).toHaveBeenCalledWith(
			{ id: admin.id, email: admin.email, role: 'admin' },
			undefined
		);
	});

	it('rejects non-admin roles and invalid passwords', async () => {
		findUserByEmail.mockResolvedValue(user);
		await expect(
			login({ email: user.email, password: adminPassword, turnstileToken: validToken })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });

		findUserByEmail.mockResolvedValue(admin);
		await expect(
			login({ email: admin.email, password: 'wrong-password', turnstileToken: validToken })
		).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });

		findUserByEmail.mockResolvedValue(null);
		await expect(
			login({ email: 'none@sinarberkah.com', password: 'pw', turnstileToken: validToken })
		).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
	});
});

describe('logout', () => {
	it('clears session cookie', async () => {
		const res = await logout();
		expect(res.result).toEqual({ loggedOut: true });
		expect(clearSessionCookie).toHaveBeenCalled();
	});
});
