import { getR2Provider } from '#lib/server/storage/r2.js';
import type { StorageProvider } from '#lib/server/storage/types.js';

export type StorageProviderKind = 'r2';

/** Returns the active upload storage provider (`r2`). */
export function getStorageProviderKind(): StorageProviderKind {
	return 'r2';
}

/** Returns true because Cloudflare R2 is the sole storage provider. */
export function isR2ProviderEnabled(): boolean {
	return true;
}

/** Returns the R2 storage provider instance. */
export function getR2Storage(): StorageProvider {
	return getR2Provider();
}
