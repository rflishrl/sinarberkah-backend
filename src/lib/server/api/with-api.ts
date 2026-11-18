import type { Cookies } from '@sveltejs/kit';
import { z } from 'zod';

import type { ApiResponse } from '#lib/api/types.js';
import { AppError } from '#lib/server/api/errors.js';
import { consumeRateLimit, getClientIp, type RateLimitRule } from '#lib/server/api/rate-limit.js';
import { assertSameOrigin, isSafeMethod } from '#lib/server/api/request.js';
import type { Actor } from '#lib/server/auth/actor.js';
import { getCurrentAdmin } from '#lib/server/auth/session.js';
import { ConfigError, getAllowedOrigins } from '#lib/server/env.js';
import { log } from '#lib/server/log.js';

type Access = 'public' | 'session' | 'admin';

interface WithApiOptions<A extends Access> {
	access: A;
	rateLimit?: RateLimitRule;
	sameOrigin?: boolean;
}

interface BaseContext<P> {
	request: Request;
	params: P;
	requestId: string;
	clientIp: string;
	cookies?: Cookies;
}

export type ApiContext<A extends Access, P> = BaseContext<P> &
	(A extends 'admin' ? { actor: Actor } : { actor: null });

export interface ApiResult<T> {
	data: T;
	status?: number;
	headers?: HeadersInit;
}

interface RouteContext<P> {
	params?: Promise<P> | P;
	cookies?: Cookies;
	getClientAddress?: () => string;
}

function resolveClientIp(request: Request, getClientAddress?: () => string): string {
	if (typeof getClientAddress === 'function') {
		try {
			const addr = getClientAddress().trim();
			if (addr) return addr;
		} catch {
			// Adapter/preview may throw if socket/header is unavailable in unit tests.
		}
	}
	return getClientIp(request);
}

const NO_STORE = 'private, no-store';

function json<T>(body: ApiResponse<T>, status: number, headers?: HeadersInit): Response {
	const response = Response.json(body, { status });
	if (headers) {
		const extra = new Headers(headers);
		extra.forEach((value, key) => {
			if (key.toLowerCase() === 'set-cookie') response.headers.append(key, value);
			else response.headers.set(key, value);
		});
	}
	return response;
}

function toFailure(error: unknown, requestId: string, request: Request): Response {
	const where = {
		requestId,
		method: request.method,
		path: new URL(request.url).pathname
	};

	if (error instanceof AppError) {
		if (error.status >= 500) log('error', error.message, { ...where, error });
		else if (error.cause) log('warn', error.message, { ...where, error });
		const response = json({ success: false, error: error.message }, error.status);
		if (error.retryAfterSeconds !== undefined) {
			response.headers.set('Retry-After', String(error.retryAfterSeconds));
		}
		return response;
	}
	if (error instanceof z.ZodError) {
		const first = error.issues[0]?.message;
		return json({ success: false, error: first ?? 'Data yang dikirim tidak valid.' }, 422);
	}
	if (error instanceof ConfigError) {
		log('error', 'konfigurasi server belum lengkap', { ...where, error });
		return json({ success: false, error: 'Server belum dikonfigurasi dengan benar.' }, 500);
	}

	log('error', 'error tak terduga', { ...where, error });
	return json({ success: false, error: 'Terjadi kesalahan pada server.' }, 500);
}

function applyCors(request: Request, response: Response): void {
	const origin = request.headers.get('origin');
	if (origin && getAllowedOrigins().includes(origin)) {
		response.headers.set('Access-Control-Allow-Origin', origin);
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
		response.headers.set(
			'Access-Control-Allow-Headers',
			'Content-Type, Authorization, x-request-id'
		);
		response.headers.append('Vary', 'Origin');
	}
}

export function handlePreflight(request: Request): Response {
	const origin = request.headers.get('origin');
	const headers = new Headers();
	if (origin && getAllowedOrigins().includes(origin)) {
		headers.set('Access-Control-Allow-Origin', origin);
		headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
		headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id');
		headers.set('Access-Control-Max-Age', '86400');
		headers.append('Vary', 'Origin');
	}
	return new Response(null, { status: 204, headers });
}

/**
 * Wraps SvelteKit Route Handlers (and plain Request calls in unit tests):
 * verifies Origin -> checks rate limit -> authenticates session -> invokes handler -> returns ApiResponse.
 */
export function withApi<A extends Access, P = Record<string, string>, T = unknown>(
	options: WithApiOptions<A>,
	handler: (context: ApiContext<A, P>) => Promise<ApiResult<T>>
) {
	return async (
		reqOrEvent:
			| Request
			| {
					request: Request;
					params?: Promise<P> | P;
					cookies?: Cookies;
					getClientAddress?: () => string;
			  },
		route?: RouteContext<P>
	): Promise<Response> => {
		const isEvent =
			reqOrEvent &&
			typeof reqOrEvent === 'object' &&
			'request' in reqOrEvent &&
			!(reqOrEvent instanceof Request);
		const request = isEvent
			? (reqOrEvent as { request: Request }).request
			: (reqOrEvent as Request);
		const rawParams = isEvent ? (reqOrEvent as { params?: Promise<P> | P }).params : route?.params;
		const params = (rawParams instanceof Promise ? await rawParams : (rawParams ?? {})) as P;
		const cookies = isEvent ? (reqOrEvent as { cookies?: Cookies }).cookies : route?.cookies;
		const getClientAddress = isEvent
			? (reqOrEvent as { getClientAddress?: () => string }).getClientAddress
			: route?.getClientAddress;
		const clientIp = resolveClientIp(request, getClientAddress);

		const requestId = request.headers.get('x-vercel-id') ?? crypto.randomUUID();
		let response: Response;

		if (request.method === 'OPTIONS' && options.access === 'public') {
			return handlePreflight(request);
		}

		try {
			if (options.sameOrigin !== false && !isSafeMethod(request.method)) {
				assertSameOrigin(request);
			}
			if (options.rateLimit) {
				await consumeRateLimit(options.rateLimit, clientIp, requestId);
			}

			let resolved: BaseContext<P> & { actor: Actor | null };

			if (options.access === 'admin') {
				const actor = await getCurrentAdmin(request, cookies);
				if (!actor) {
					throw new AppError('UNAUTHENTICATED', 'Anda harus login sebagai admin.');
				}
				resolved = { request, params, requestId, clientIp, cookies, actor };
			} else {
				resolved = { request, params, requestId, clientIp, cookies, actor: null };
			}

			const result = await handler(resolved as unknown as ApiContext<A, P>);
			response = json({ success: true, data: result.data }, result.status ?? 200, result.headers);
			if (options.access === 'public') applyCors(request, response);
			response.headers.set('Cache-Control', NO_STORE);
		} catch (error) {
			response = toFailure(error, requestId, request);
			response.headers.set('Cache-Control', NO_STORE);
			if (options.access === 'public') applyCors(request, response);
		}

		response.headers.set('x-request-id', requestId);
		return response;
	};
}
