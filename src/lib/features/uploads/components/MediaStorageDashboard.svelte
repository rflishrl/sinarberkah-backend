<script lang="ts">
	import {
		AlertTriangle,
		CheckCircle2,
		CircleAlert,
		Clock,
		HardDrive,
		RefreshCw
	} from '@lucide/svelte';

	import { apiRequest } from '#lib/api/client.js';
	import PaginationNav from '#lib/components/admin-kit/PaginationNav.svelte';
	import Thumb from '#lib/components/admin-kit/Thumb.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import {
		MEDIA_STORAGE_DEFAULT_LIMIT,
		type MediaQuotaStatus,
		type MediaStorageSummaryDto
	} from '#lib/features/uploads/schemas.js';
	import { cn, formatDate } from '#lib/utils.js';

	interface Props {
		initialData: MediaStorageSummaryDto | null;
		initialError?: string | null;
		page: number;
	}

	let { initialData, initialError = null, page }: Props = $props();

	let refetched = $state<{ page: number; data: MediaStorageSummaryDto } | null>(null);
	let liveError = $state<string | null>(null);
	let isFetching = $state(false);

	let activeData = $derived(refetched?.page === page ? refetched.data : initialData);
	let activeError = $derived(liveError ?? initialError);

	async function refetch(): Promise<void> {
		if (isFetching) return;
		isFetching = true;
		liveError = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(MEDIA_STORAGE_DEFAULT_LIMIT)
			});
			const data = await apiRequest<MediaStorageSummaryDto>(
				`/api/admin/storage?${params.toString()}`
			);
			refetched = { page, data };
		} catch (err) {
			liveError = err instanceof Error ? err.message : 'Gagal memuat data penyimpanan.';
		} finally {
			isFetching = false;
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes <= 0) return '0 B';
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${Math.round(kb)} KB`;
		const mb = kb / 1024;
		if (mb < 1024) return `${mb.toFixed(1)} MB`;
		return `${(mb / 1024).toFixed(2)} GB`;
	}

	function formatMbOrGb(mb: number): string {
		if (mb >= 1024) {
			return `${(mb / 1024).toFixed(2)} GB (${mb.toLocaleString('id-ID')} MB)`;
		}
		return `${mb.toLocaleString('id-ID')} MB`;
	}

	function getQuotaBadgeConfig(status: MediaQuotaStatus) {
		switch (status) {
			case 'critical':
				return {
					label: 'Kritis (>= 90%)',
					className:
						'border border-destructive/30 bg-destructive/10 text-destructive dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-300',
					fillColor: 'var(--destructive)'
				};
			case 'warning':
				return {
					label: 'Waspada (70-89%)',
					className:
						'border border-amber-500/30 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300',
					fillColor: '#d97706'
				};
			default:
				return {
					label: 'Normal (< 70%)',
					className:
						'border border-success/25 bg-success-soft text-success dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300',
					fillColor: 'var(--color-success)'
				};
		}
	}
</script>

{#if activeError && !activeData}
	<div
		role="alert"
		class="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
	>
		<CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
		<div class="space-y-2">
			<p class="font-semibold">Data penyimpanan gagal dimuat</p>
			<p>{activeError}</p>
			<Button variant="outline" class="mt-2 h-11" onclick={() => void refetch()}>
				<RefreshCw class="size-4" aria-hidden="true" />
				<span>Muat ulang</span>
			</Button>
		</div>
	</div>
{:else if activeData}
	{@const { usage, config, items, pagination } = activeData}
	{@const badge = getQuotaBadgeConfig(usage.status)}
	{@const fullShare =
		usage.usedBytes > 0 ? Math.round((usage.fullBytes / usage.usedBytes) * 100) : 0}
	{@const thumbShare = usage.usedBytes > 0 ? 100 - fullShare : 0}

	<div aria-busy={isFetching} class="space-y-6">
		<div class="flex justify-end">
			<Button
				type="button"
				variant="outline"
				size="lg"
				class="h-11 px-4"
				onclick={() => void refetch()}
				disabled={isFetching}
			>
				<RefreshCw class={cn('size-4', isFetching && 'animate-spin')} aria-hidden="true" />
				<span>{isFetching ? 'Menyegarkan...' : 'Segarkan data'}</span>
			</Button>
		</div>

		<section class="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 id="quota-summary-title" class="text-base font-semibold text-foreground">
						Ringkasan Kuota Media R2
					</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Akumulasi pemakaian varian full + thumbnail tercatat di Neon DB (tanpa ListObjectsV2).
					</p>
				</div>
				<span
					class={cn(
						'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
						badge.className
					)}
				>
					{#if usage.status === 'critical'}
						<CircleAlert class="size-3.5" aria-hidden="true" />
					{:else if usage.status === 'warning'}
						<AlertTriangle class="size-3.5" aria-hidden="true" />
					{:else}
						<CheckCircle2 class="size-3.5" aria-hidden="true" />
					{/if}
					{badge.label}
				</span>
			</div>

			<div class="mt-5 space-y-4">
				<div class="flex flex-wrap items-baseline justify-between gap-3">
					<div>
						<p class="font-heading text-2xl font-extrabold tabular-nums sm:text-3xl">
							{formatBytes(usage.usedBytes)}
						</p>
						<p class="text-sm text-muted-foreground tabular-nums">
							dari kuota aplikasi {formatMbOrGb(usage.quotaMb)}
						</p>
					</div>
					<div class="text-left sm:text-right">
						<p class="text-lg font-bold tabular-nums">{usage.usedPercent}% terpakai</p>
						<p class="text-sm text-muted-foreground tabular-nums">
							Sisa kuota {formatBytes(usage.remainingBytes)} &middot;
							{usage.totalCount.toLocaleString('id-ID')} aset
						</p>
					</div>
				</div>

				<progress
					aria-labelledby="quota-summary-title"
					value={usage.usedBytes}
					max={usage.quotaBytes}
					style:--quota-fill={badge.fillColor}
					class="quota-progress h-2.5 w-full"
				></progress>
			</div>
		</section>

		<div class="grid gap-4 md:grid-cols-2">
			<section class="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
				<h2 class="text-base font-semibold text-foreground">Komposisi &amp; Status Aset</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Pemecahan ukuran file WebP serta status referensi konten aktif.
				</p>
				<div class="mt-5 space-y-3 text-sm">
					<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
						<span class="text-muted-foreground">Gambar Full (maks 1920 px)</span>
						<span class="font-semibold tabular-nums">
							{formatBytes(usage.fullBytes)} ({fullShare}%)
						</span>
					</div>
					<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
						<span class="text-muted-foreground">Thumbnail (maks 480 px)</span>
						<span class="font-semibold tabular-nums">
							{formatBytes(usage.thumbBytes)} ({thumbShare}%)
						</span>
					</div>
					<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
						<span class="text-muted-foreground">Aset Aktif (dipakai konten)</span>
						<span class="font-semibold tabular-nums">
							{usage.activeCount.toLocaleString('id-ID')} aset
						</span>
					</div>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="text-muted-foreground">Aset Orphan</span>
						<span class="text-right font-semibold tabular-nums">
							{usage.orphanCount.toLocaleString('id-ID')} total
							{#if usage.orphanCount > 0}
								<span class="block text-xs font-normal text-muted-foreground">
									{usage.gracePeriodOrphanCount} tenggang 24 jam &middot;
									{usage.eligibleCleanupCount} siap dibersihkan
								</span>
							{/if}
						</span>
					</div>
				</div>
			</section>

			<section class="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
				<h2 class="text-base font-semibold text-foreground">Konfigurasi Penyimpanan</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Metadata non-rahasia lingkungan runtime saat ini.
				</p>
				<div class="mt-5 space-y-3 text-sm">
					<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
						<span class="text-muted-foreground">Provider Aktif</span>
						<span
							class="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
						>
							Cloudflare R2
						</span>
					</div>
					<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
						<span class="text-muted-foreground">Bucket Target</span>
						<span class="font-mono text-xs font-semibold">
							{config.bucketName ?? 'Belum diatur'}
						</span>
					</div>
					<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
						<span class="text-muted-foreground">Environment &amp; Prefix Key</span>
						<span class="font-mono text-xs font-semibold">
							{config.environment} ({config.keyPrefix})
						</span>
					</div>
					<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
						<span class="text-muted-foreground">Domain Media Publik</span>
						<span
							class={cn(
								'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
								config.publicDomainConfigured
									? 'border border-border text-foreground'
									: 'bg-secondary text-secondary-foreground'
							)}
						>
							{config.publicDomainConfigured ? 'Terkonfigurasi' : 'Belum diatur'}
						</span>
					</div>
					<div class="flex items-center justify-between gap-2">
						<span class="text-muted-foreground">Batas Upload per File</span>
						<span class="font-semibold tabular-nums">{config.maxUploadMb} MB</span>
					</div>
				</div>
			</section>
		</div>

		<section aria-labelledby="media-assets-heading" class="space-y-4">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 id="media-assets-heading" class="font-heading text-lg font-bold">
					Daftar Aset Media R2
				</h2>
				<p class="text-xs text-muted-foreground tabular-nums">
					Menampilkan {items.length} dari {pagination.total.toLocaleString('id-ID')} aset
				</p>
			</div>

			{#if items.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center"
				>
					<div
						class="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
					>
						<HardDrive class="size-5" aria-hidden="true" />
					</div>
					<h3 class="text-base font-semibold text-foreground">Belum ada aset di media_objects</h3>
					<p class="mt-1 max-w-md text-sm text-muted-foreground">
						Unggah foto produk, portofolio, atau galeri baru untuk melihat catatan objek WebP di
						sini.
					</p>
				</div>
			{:else}
				<div class="hidden overflow-hidden rounded-lg bg-card shadow-card md:block">
					<table class="w-full caption-bottom text-sm">
						<caption class="sr-only">Daftar aset media R2 yang tercatat di database</caption>
						<thead class="border-b border-border bg-muted/60">
							<tr>
								<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">
									Aset &amp; Dimensi
								</th>
								<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">
									Folder
								</th>
								<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">
									Ukuran (Full + Thumb)
								</th>
								<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">
									Status
								</th>
								<th scope="col" class="h-10 px-4 text-right font-medium text-muted-foreground">
									Tanggal Unggah
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each items as item (item.key)}
								<tr class="transition-colors hover:bg-muted/30">
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<Thumb src={item.thumbUrl} />
											<div class="min-w-0">
												<p
													class="max-w-xs truncate font-mono text-xs font-semibold"
													title={item.key}
												>
													{item.key}
												</p>
												<p class="text-xs text-muted-foreground tabular-nums">
													{item.width} x {item.height} px
												</p>
											</div>
										</div>
									</td>
									<td class="px-4 py-3">
										<span
											class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium"
										>
											{item.folder || 'umum'}
										</span>
									</td>
									<td class="px-4 py-3 tabular-nums">
										<p class="font-semibold">{formatBytes(item.totalBytes)}</p>
										<p class="text-xs text-muted-foreground">
											{formatBytes(item.sizeBytes)} + {formatBytes(item.thumbSizeBytes)}
										</p>
									</td>
									<td class="px-4 py-3">
										{#if item.isReferenced}
											<span
												class="inline-flex items-center gap-1 rounded-md border border-success/25 bg-success-soft px-2 py-0.5 text-xs font-medium text-success dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300"
											>
												<CheckCircle2 class="size-3.5" aria-hidden="true" />
												Aktif
											</span>
										{:else if item.isEligibleForCleanup}
											<span
												class="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300"
											>
												<AlertTriangle class="size-3.5" aria-hidden="true" />
												Siap dibersihkan
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
											>
												<Clock class="size-3.5" aria-hidden="true" />
												Tenggang 24 jam
											</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-right text-muted-foreground tabular-nums">
										{formatDate(item.createdAt)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<ul class="space-y-3 md:hidden">
					{#each items as item (item.key)}
						<li class="rounded-lg bg-card p-4 shadow-card">
							<div class="flex gap-3">
								<Thumb src={item.thumbUrl} />
								<div class="min-w-0 flex-1 space-y-1">
									<p class="truncate font-mono text-xs font-semibold" title={item.key}>
										{item.key}
									</p>
									<p class="text-xs text-muted-foreground tabular-nums">
										{item.width} x {item.height} px &middot; {formatBytes(item.totalBytes)} (
										{formatBytes(item.sizeBytes)} + {formatBytes(item.thumbSizeBytes)})
									</p>
									<div class="flex flex-wrap items-center gap-2 pt-1">
										<span
											class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium"
										>
											{item.folder || 'umum'}
										</span>
										{#if item.isReferenced}
											<span
												class="inline-flex items-center gap-1 rounded-md border border-success/25 bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
											>
												<CheckCircle2 class="size-3.5" aria-hidden="true" />
												Aktif
											</span>
										{:else if item.isEligibleForCleanup}
											<span
												class="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"
											>
												<AlertTriangle class="size-3.5" aria-hidden="true" />
												Siap dibersihkan
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
											>
												<Clock class="size-3.5" aria-hidden="true" />
												Tenggang 24 jam
											</span>
										{/if}
									</div>
								</div>
							</div>
							<p
								class="mt-2 border-t border-border pt-2 text-xs text-muted-foreground tabular-nums"
							>
								Diunggah {formatDate(item.createdAt)}
							</p>
						</li>
					{/each}
				</ul>

				<PaginationNav {pagination} basePath="/admin/storage" q="" />
			{/if}
		</section>
	</div>
{/if}
