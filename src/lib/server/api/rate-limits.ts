import type { RateLimitRule } from '#lib/server/api/rate-limit.js';

const PREFIX = 'rl:sinarberkah';

/** PostgreSQL-backed rate limiting rules keyed by operation category. */
export const RATE_LIMITS = {
	/** Public read operations without CDN caching. Frontend fetches on cache invalidation. */
	publicRead: { name: 'public-read', limit: 120, windowSeconds: 60 },
	health: { name: 'health', limit: 30, windowSeconds: 60 },
	login: { name: `${PREFIX}:login`, limit: 5, windowSeconds: 15 * 60 },
	upload: { name: `${PREFIX}:upload`, limit: 20, windowSeconds: 60 }
} satisfies Record<string, RateLimitRule>;
