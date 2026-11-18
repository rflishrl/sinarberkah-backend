import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email('Email tidak valid.')),
	password: z.string().min(1, 'Password wajib diisi.').max(200),
	turnstileToken: z.string().min(1, 'Verifikasi keamanan Turnstile diperlukan.')
});

export type LoginInput = z.input<typeof loginSchema>;

export interface LoginResult {
	email: string;
}
