import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

import { env } from '#lib/server/env.js';

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
	if (!cachedSql) {
		const connectionString = env.DATABASE_URI;
		cachedSql = neon(connectionString);
	}
	return cachedSql;
}
