import type { Cookies } from '@sveltejs/kit';

import { type LoginResult, loginSchema } from '#lib/features/auth/schemas.js';
import { AppError } from '#lib/server/api/errors.js';
import { verifyPassword } from '#lib/server/auth/password.js';
import { clearSessionCookie, setSessionCookie } from '#lib/server/auth/session.js';
import { findUserByEmail } from '#lib/server/features/auth/repository.js';

/** Authenticates admin users against Neon admin_users table. */
export async function login(
	rawInput: unknown,
	cookies?: Cookies
): Promise<{ result: LoginResult; setCookieHeader: string }> {
	const { email, password } = loginSchema.parse(rawInput);

	const user = await findUserByEmail(email);
	if (!user || !verifyPassword(password, user.password_hash)) {
		throw new AppError('UNAUTHENTICATED', 'Email atau password salah.');
	}

	if (user.role !== 'admin') {
		throw new AppError('FORBIDDEN', 'Akun ini tidak punya akses admin.');
	}

	const setCookieHeader = setSessionCookie(
		{ id: user.id, email: user.email, role: 'admin' },
		cookies
	);
	return { result: { email: user.email }, setCookieHeader };
}

/** Signs out user by deleting the session cookie. */
export async function logout(
	cookies?: Cookies
): Promise<{ result: { loggedOut: true }; setCookieHeader: string }> {
	const setCookieHeader = clearSessionCookie(cookies);
	return { result: { loggedOut: true }, setCookieHeader };
}
